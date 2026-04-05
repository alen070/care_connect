/**
 * ============================================
 * AUTHENTICATION CONTEXT — Supabase Auth
 * ============================================
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, AuthContextType, RegistrationResult } from '../types';
import { supabase } from '../lib/supabase';
import { UserDB, initializeDatabase, ShelterDB, NurseProfileDB } from './database';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ─── Role Persistence for Google OAuth ─── */
  const setIntendedRole = (role: string) => localStorage.setItem('intended_role', role);
  const getIntendedRole = () => localStorage.getItem('intended_role');
  const clearIntendedRole = () => localStorage.removeItem('intended_role');

  /**
   * Shared helper: given a session, apply the intended role upgrade,
   * create sub-profiles, and return the final User object.
   * This is called from BOTH getSession and onAuthStateChange
   * so the logic is never skipped.
   */
  const resolveUserFromSession = async (session: any): Promise<User | null> => {
    const meta = session.user.user_metadata;
    const intendedRole = getIntendedRole();
    console.log('[AuthContext] resolveUser — meta:', meta, 'intendedRole:', intendedRole);

    // 1. Try to fetch existing profile (the Supabase trigger may have created one with role='user')
    let profile = await UserDB.getById(session.user.id);
    console.log('[AuthContext] resolveUser — DB profile:', profile);

    // 2. If profile is missing from DB, do a quick poll (Max 1s total)
    if (!profile) {
      for (let i = 0; i < 3; i++) {
        await new Promise(r => setTimeout(r, 330));
        profile = await UserDB.getById(session.user.id);
        if (profile) break;
      }
    }

    // 3. ROLE UPGRADE (Fail-safe & Non-blocking)
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('careconnect_role');
    const finalIntendedRole = urlRole || intendedRole;

    // IMMEDIATE CLEANUP — prevents App.tsx from hanging on the safety-check
    if (finalIntendedRole && finalIntendedRole !== 'user') {
      clearIntendedRole();
      if (urlRole) window.history.replaceState({}, '', window.location.origin);
    }

    if (finalIntendedRole && finalIntendedRole !== 'user') {
      // Use profile role, fallback to metadata role, finally default to 'user'
      const currentRole = profile?.role || meta?.role || 'user';
      
      if (currentRole === 'user' || currentRole === '') {
        console.log('[AuthContext] Role Migration Required:', currentRole, '→', finalIntendedRole);
        try {
          // A. Update Supabase Metadata
          await supabase.auth.updateUser({ data: { role: finalIntendedRole } });

          // B. Extremely Fast Poll (Max 0.6s total)
          for (let i = 0; i < 3; i++) {
            await new Promise(r => setTimeout(r, 200));
            profile = await UserDB.getById(session.user.id);
            if (profile?.role === finalIntendedRole) break;
          }

          // C. Forced Fallback — only if migration failed/slow
          if (!profile || profile.role !== finalIntendedRole) {
            console.warn('[AuthContext] Migration slow. Forcing DB update.');
            const updated = await UserDB.update(session.user.id, { 
              role: finalIntendedRole as any,
              email: session.user.email
            });
            if (updated) profile = updated;
          }
        } catch (e) {
          console.error('[AuthContext] Migration logic failed:', e);
        }
      }
    }

    // 4. If we still don't have a profile at all, create a stub
    if (!profile) {
      profile = {
        id: session.user.id,
        email: session.user.email!,
        name: meta?.name || meta?.full_name || 'New User',
        role: (intendedRole as any) || (meta?.role as any) || 'user',
        phone: meta?.phone || '',
        location: meta?.location || '',
        created_at: session.user.created_at
      } as User;
    }

    // 5. Create sub-profiles (nurse_profiles / shelters) if missing — FAST & PARALLEL
    const role = profile.role;
    try {
      if (role === 'nurse') {
        // We don't necessarily need to block the whole user resolution for this
        // But for consistency we check it
        NurseProfileDB.getByUserId(profile.id).then(async (n) => {
          if (!n) {
            console.log('[AuthContext] Creating missing nurse_profile in background');
            await NurseProfileDB.create({
              userId: profile!.id, specializations: [], experience: 0, baseRate: 0,
              rateType: 'hourly', bio: '', location: profile!.location || '',
              serviceAreas: [], availability: true, verificationStatus: 'pending', documents: []
            });
          }
        }).catch(console.error);
      } else if (role === 'shelter') {
        ShelterDB.getByUserId(profile.id).then(async (s) => {
          if (!s) {
            const orphan = await ShelterDB.getByEmail(profile!.email);
            if (orphan && !orphan.shelterUserId) {
              await ShelterDB.update(orphan.id, { shelterUserId: profile!.id });
            } else if (!orphan) {
              await ShelterDB.create({
                name: (meta?.name || profile!.name || 'New') + ' Shelter',
                address: profile!.location || '',
                latitude: 0, longitude: 0, phone: profile!.phone || '',
                email: profile!.email, capacity: 50, shelterUserId: profile!.id
              });
            }
          }
        }).catch(console.error);
      }
    } catch (e) {
      console.warn('[AuthContext] Sub-profile repair failed (non-critical):', e);
    }

    return profile;
  };

  // Initialize database and session
  useEffect(() => {
    initializeDatabase();

    // === 1. Restore session on page load ===
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await resolveUserFromSession(session);
        if (profile) setUser(profile);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Fallback loading safety
    const timeout = setTimeout(() => setLoading(false), 8000);

    // === 2. Listen for auth state changes (login, logout, token refresh) ===
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] onAuthStateChange:', event);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          clearIntendedRole();
          return;
        }

        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          const profile = await resolveUserFromSession(session);
          if (profile) setUser(profile);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[AuthContext] Attempting login for:', email);
    const loginPromise = supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Login timed out. Your connection to Supabase is too slow. Please check your network and try again.')), 60000)
    );

    try {
      console.log('[AuthContext] Waiting for Supabase response...');
      const { data, error }: any = await Promise.race([loginPromise, timeoutPromise]);

      console.log('[AuthContext] Login response:', { data, error });

      if (error) return { success: false, error: error.message };

      if (data.user) {
        const profile = await UserDB.getById(data.user.id);
        console.log('[AuthContext] Profile after login:', profile);
        if (profile) setUser(profile);
      }
      return { success: true };
    } catch (err: any) {
      console.error('[AuthContext] Login catch block:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const loginWithPhone = useCallback(async (phone: string, otp: string) => {
    if (!phone) return { success: false, error: 'Phone required' };
    if (!otp) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      return error ? { success: false, error: error.message } : { success: true };
    }
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
    if (error) return { success: false, error: error.message };
    if (data.user) {
      const profile = await UserDB.getById(data.user.id);
      if (profile) setUser(profile);
    }
    return { success: true };
  }, []);

  const loginWithGoogle = useCallback(async (intendedRole?: string) => {
    console.log('[AuthContext] loginWithGoogle — intended:', intendedRole);
    if (intendedRole) setIntendedRole(intendedRole);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: intendedRole 
          ? `${window.location.origin}/?careconnect_role=${intendedRole}` 
          : window.location.origin,
        queryParams: intendedRole ? { role: intendedRole } : {},
      },
    });
    return error ? { success: false, error: error.message } : { success: true };
  }, []);

  const register = useCallback(async (data: any): Promise<RegistrationResult> => {
    console.log('[AuthContext] Registering start for:', data.email);
    
    // Clean up metadata to ensure no undefined/null issues
    const metadata = {
      name: String(data.role === 'shelter' ? (data.shelterName || data.name) : data.name),
      phone: String(data.phone || ''),
      role: data.role || 'user',
      location: String(data.role === 'shelter' ? (data.shelterAddress || '') : (data.location || '')),
      shelterLat: Number(data.shelterLat) || 0,
      shelterLng: Number(data.shelterLng) || 0,
      shelterCapacity: Number(data.shelterCapacity) || 50,
      specializations: Array.isArray(data.specializations) ? data.specializations : [],
      experience: Number(data.experience) || 0,
      baseRate: Number(data.baseRate) || 0,
    };

    console.log('[AuthContext] Registration Metadata:', metadata);

    // Check if email was already registered (Optimization: bypass redundant getByEmail if network is slow)
    // We let Supabase signUp handle the logic and catch the error if it already exists
    // This reduces the hang-time for the user.

    console.log('[AuthContext] Calling supabase.auth.signUp...');
    const signUpPromise = supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: { 
        data: metadata,
        emailRedirectTo: window.location.origin
      },
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Registration is taking longer than usual. This is likely a network issue. Please try again.')), 12000)
    );

    try {
      const { data: signUpData, error }: any = await Promise.race([signUpPromise, timeoutPromise]);
      
      console.log('[AuthContext] Registration raw response:', { signUpData, error });

      if (error) {
        if (error.message.includes('rate limit')) {
          return { success: false, error: 'Signup rate limit exceeded. Please wait 5-10 minutes before trying again.' };
        }
        return { success: false, error: error.message };
      }
      
      if (!signUpData?.user && !signUpData?.session) {
         // Some Supabase configurations don't return user/session if email confirmation is on
         // But they still record the signup.
         return { success: true }; 
      }

      const uid = signUpData.user?.id || signUpData.session?.user?.id;
      
      // Secondary safety: manually create secondary profiles if session started
      if (uid && signUpData.session) {
        if (data.role === 'nurse') {
          await NurseProfileDB.create({
            userId: uid, specializations: [], experience: 0, baseRate: 0,
            rateType: 'hourly', bio: '', location: data.location || '',
            serviceAreas: [], availability: true, verificationStatus: 'pending', documents: []
          }).catch(console.error);
        } else if (data.role === 'shelter') {
          await ShelterDB.create({
            name: data.shelterName || data.name,
            address: data.shelterAddress || data.location || '',
            latitude: data.shelterLat || 0, longitude: data.shelterLng || 0,
            phone: data.phone || '', email: data.email,
            capacity: data.shelterCapacity || 50, shelterUserId: uid,
          }).catch(console.error);
        }
      }

      return { success: true, session: signUpData.session, user: signUpData.user };
    } catch (err: any) {
      console.error('[AuthContext] Registration Error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    return error ? { success: false, error: error.message } : { success: true };
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return error ? { success: false, error: error.message } : { success: true };
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] Logging out...');
      // Clear local state FIRST for instant UI response
      setUser(null);
      clearIntendedRole();
      // Clear ALL local storage for a truly nuclear reset
      localStorage.clear();
      
      console.log('[AuthContext] Logout successful. Performing hard refresh.');
      window.location.replace('/'); // Replace to stop back-navigation to stale state
    } catch (e) {
      console.error('[AuthContext] Logout error:', e);
      window.location.href = '/'; 
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User> & any) => {
    if (!user) return;
    
    console.log('[AuthContext] updateUser starting:', updates);
    const { shelterLat, shelterLng, shelterName, shelterAddress, ...coreUpdates } = updates;
    
    try {
      // 1. Primary Profile Update (Must succeed)
      // Ensure we include email for the upsert logic in database.ts
      const updated = await UserDB.update(user.id, { ...coreUpdates, email: coreUpdates.email || user.email });
      if (!updated) {
        throw new Error('Failed to update your basic profile. Please check your connection.');
      }

      // Proactively update local state so UI can transition
      setUser(updated);
      console.log('[AuthContext] Profile updated successfully');

      // 2. Secondary Resource Repair (Background-ish)
      const role = updated.role;
      if (role === 'shelter') {
        try {
          let s = await ShelterDB.getByUserId(updated.id);
          if (!s) {
            console.log('[AuthContext] Shelter missing. Checking email link...');
            s = await ShelterDB.getByEmail(updated.email);
            if (s && !s.shelterUserId) {
              await ShelterDB.update(s.id, { shelterUserId: updated.id });
            }
          }

          if (!s) {
            console.log('[AuthContext] Creating new shelter facility...');
            await ShelterDB.create({
              name: shelterName || updated.name,
              address: shelterAddress || updated.location || '',
              latitude: Number(shelterLat) || 0,
              longitude: Number(shelterLng) || 0,
              phone: updated.phone || '',
              email: updated.email,
              capacity: 50,
              shelterUserId: updated.id
            });
          } else if (shelterLat !== undefined || shelterLng !== undefined || shelterName) {
            console.log('[AuthContext] Updating existing shelter coordinates...');
            await ShelterDB.update(s.id, {
              latitude: shelterLat !== undefined ? Number(shelterLat) : s.latitude,
              longitude: shelterLng !== undefined ? Number(shelterLng) : s.longitude,
              name: shelterName || s.name,
              address: shelterAddress || s.address
            });
          }
        } catch (shelterErr) {
          console.error('[AuthContext] Non-critical Shelter Repair error:', shelterErr);
          // We don't throw here. The user profile is already updated.
        }
      } else if (role === 'nurse') {
        try {
          const n = await NurseProfileDB.getByUserId(updated.id);
          if (!n) {
            await NurseProfileDB.create({
              userId: updated.id, specializations: [], experience: 0,
              baseRate: 0, rateType: 'hourly', bio: '', location: updated.location || '',
              serviceAreas: [], availability: true, verificationStatus: 'pending', documents: []
            });
          }
        } catch (nurseErr) {
          console.error('[AuthContext] Non-critical Nurse Repair error:', nurseErr);
        }
      }

      return true;
    } catch (err: any) {
      console.error('[AuthContext] updateUser CRITICAL error:', err);
      throw err;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      login, loginWithPhone, loginWithGoogle, register, resetPassword, resendVerificationEmail, logout, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}







