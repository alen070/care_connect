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

  // Initialize database and session
  useEffect(() => {
    initializeDatabase();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await UserDB.getById(session.user.id);
        if (profile) setUser(profile);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Fallback loading safety
    const timeout = setTimeout(() => setLoading(false), 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] onAuthStateChange Event:', event, 'Session User ID:', session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out');
          setUser(null);
          setLoading(false);
          clearIntendedRole();
          return;
        }

        if (session?.user) {
          const meta = session.user.user_metadata;
          const intendedRole = getIntendedRole();
          console.log('[AuthContext] Session active. Meta:', meta, 'IntendedRole:', intendedRole);
          
          let profile = await UserDB.getById(session.user.id);
          console.log('[AuthContext] Initial profile fetch result:', profile);

          // Provide an immediate stub so App.tsx doesn't flicker back to Landing
          if (!profile) {
             console.log('[AuthContext] Profile not found in DB yet. Creating temporary stub.');
             const stub = {
               id: session.user.id,
               email: session.user.email!,
               name: meta?.name || 'New User',
               role: (intendedRole as any) || (meta?.role as any) || 'user',
               phone: meta?.phone || '',
               location: meta?.location || '',
               created_at: session.user.created_at
             } as User;
             setUser(stub);
          } else {
             setUser(profile);
          }
          
          setLoading(false); // Signal that we have AT LEAST a stub

          // Polling for trigger-created profile (Background - deep sync)
          if (!profile) {
             console.log('[AuthContext] Starting profile polling...');
             let attempts = 0;
             while (!profile && attempts < 3) {
               await new Promise(r => setTimeout(r, 800));
               profile = await UserDB.getById(session.user.id);
               if (profile) {
                 console.log('[AuthContext] Profile found during polling!');
                 break;
               }
               attempts++;
             }
          }

          if (profile) setUser(profile);

          // Role Repair Logic (Handle missing profile or Google default 'user' role)
          const currentRole = profile?.role || meta?.role || '';
          console.log('[AuthContext] currentRole:', currentRole);
          
          if (intendedRole && (currentRole === 'user' || currentRole === '')) {
            console.log('[AuthContext] Upgrading account to intended role:', intendedRole);
            try {
              if (profile) {
                profile = await UserDB.update(profile.id, { role: intendedRole as any });
              } else {
                profile = await UserDB.create({
                  id: session.user.id,
                  email: session.user.email!,
                  name: meta?.name || 'New User',
                  role: intendedRole as any,
                  phone: meta?.phone || '',
                  location: meta?.location || ''
                });
              }
              if (profile) setUser(profile);
              clearIntendedRole();
            } catch (e) {
              console.error('[AuthContext] Role upgrade failed:', e);
            }
          }

          // Resource Record Repair (Shelter/Nurse)
          const finalProfile = (profile || {
            id: session.user.id,
            email: session.user.email!,
            role: (intendedRole as any) || (meta?.role as any) || 'user',
            name: meta?.name || 'New User',
            phone: meta?.phone || '',
            location: meta?.location || '',
            created_at: session.user.created_at
          }) as User;

          if (finalProfile && finalProfile.role) {
            const role = finalProfile.role;
            console.log('[AuthContext] Checking sub-profiles for role:', role);
            if (role === 'nurse') {
              const n = await NurseProfileDB.getByUserId(finalProfile.id);
              if (!n) {
                console.log('[AuthContext] Repair: Creating missing nurse profile');
                await NurseProfileDB.create({
                  userId: finalProfile.id, specializations: [], experience: 0, baseRate: 0,
                  rateType: 'hourly', bio: '', location: finalProfile.location || '',
                  serviceAreas: [], availability: true, verificationStatus: 'pending', documents: []
                }).catch(console.error);
              }
            } else if (role === 'shelter') {
              let s = await ShelterDB.getByUserId(finalProfile.id);
              if (!s) {
                 console.log('[AuthContext] Repair: Checking for orphaned shelter by email:', finalProfile.email);
                 let orphan = await ShelterDB.getByEmail(finalProfile.email);
                 if (orphan) {
                   if (!orphan.shelterUserId) {
                     console.log('[AuthContext] Repair: Linking orphaned shelter');
                     await ShelterDB.update(orphan.id, { shelterUserId: finalProfile.id });
                   }
                 } else {
                   console.log('[AuthContext] Repair: Creating new shelter record');
                   await ShelterDB.create({
                     name: (meta?.name || finalProfile.name || 'New') + ' Shelter',
                     address: finalProfile.location || '',
                     latitude: 0, longitude: 0, phone: finalProfile.phone || '',
                     email: finalProfile.email, capacity: 50, shelterUserId: finalProfile.id
                   }).catch(console.error);
                 }
              }
            }
          }

          // Final update to set the most accurate profile
          if (profile) setUser(profile);
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
    if (intendedRole) setIntendedRole(intendedRole);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
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







