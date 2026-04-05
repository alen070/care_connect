/**
 * ============================================
 * APP - Main Entry Point
 * ============================================
 * CareConnect - Home Nurse Finder System
 *
 * Architecture:
 * - AuthContext manages authentication state
 * - Role-based routing renders appropriate dashboard
 * - Local storage simulates MongoDB collections
 * - AI module performs real pixel-level document analysis
 */

import { AuthProvider, useAuth } from '@/store/AuthContext';
import { LandingPage } from '@/components/landing/LandingPage';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';

// Lazy load large components for better performance
const AuthPage = lazy(() => import('@/components/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const UserDashboard = lazy(() => import('@/components/user/UserDashboard').then(m => ({ default: m.UserDashboard })));
const NurseDashboard = lazy(() => import('@/components/nurse/NurseDashboard').then(m => ({ default: m.NurseDashboard })));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ShelterDashboard = lazy(() => import('@/components/shelter/ShelterDashboard').then(m => ({ default: m.ShelterDashboard })));

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-gray-600 animate-pulse font-medium">Preparing your workspace...</p>
  </div>
);

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Synchronize landing page visibility with auth state
  useEffect(() => {
    console.log('[App] Auth State Changed:', { loading, isAuthenticated, userRole: user?.role });
    if (!loading && isAuthenticated) {
      console.log('[App] Authenticated! Hiding landing page.');
      setShowLanding(false);
    }
  }, [loading, isAuthenticated, user]);

  // Go back to landing page (stays logged in)
  const goToLanding = () => {
    setShowLanding(true);
  };

  // Global listener to ensure landing page is shown whenever user becomes unauthenticated
  // This handles logouts from sub-components (like NurseAccount) or session expiry
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current && !isAuthenticated) {
      setShowLanding(true);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  // Show loading spinner while restoring session
  if (loading) {
    return <LoadingFallback />;
  }

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setShowLanding(false);
    } else {
      setAuthMode('register');
      setShowLanding(false);
    }
  };

  const handleLogin = () => {
    if (isAuthenticated) {
      setShowLanding(false);
    } else {
      setAuthMode('login');
      setShowLanding(false);
    }
  };

  const renderDashboard = () => {
    // Determine target role (default to user if missing)
    const role = user?.role || 'user';

    // Transition Safety: If the URL indicates an intended role upgrade but 
    // the local user state hasn't caught up yet, stay in loading mode.
    const urlParams = new URLSearchParams(window.location.search);
    const urlRole = urlParams.get('careconnect_role');
    if (urlRole && urlRole !== 'user' && role === 'user') {
      return <LoadingFallback />;
    }

    return (
      <Suspense fallback={<LoadingFallback />}>
        {role === 'admin' && <AdminDashboard onGoToLanding={goToLanding} />}
        {role === 'nurse' && <NurseDashboard onGoToLanding={goToLanding} />}
        {role === 'user' && <UserDashboard onGoToLanding={goToLanding} />}
        {role === 'shelter' && <ShelterDashboard onGoToLanding={goToLanding} />}
      </Suspense>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}>
      {showLanding ? (
        <LandingPage onGetStarted={handleGetStarted} onLogin={handleLogin} />
      ) : (
        !isAuthenticated ? (
          <Suspense fallback={<LoadingFallback />}>
            <AuthPage initialMode={authMode} onBackToLanding={() => setShowLanding(true)} />
          </Suspense>
        ) : (
          renderDashboard()
        )
      )}
    </div>
  );
}


/** Root App with AuthProvider */
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
