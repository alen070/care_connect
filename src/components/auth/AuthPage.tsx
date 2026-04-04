/**
 * ============================================
 * AUTHENTICATION PAGE
 * ============================================
 * Login and registration forms with role selection.
 * Supports Email, Phone (OTP), and Google login.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Button, Input, Card, Select } from '../ui';
import { Shield, UserPlus, LogIn, Stethoscope, Users, ShieldCheck, Phone, Mail, ArrowLeft, Building, MapPin, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UserRole } from '../../types';
import { cn } from '../../utils/cn';
import { validateEmail, validatePhone, checkPasswordStrength } from '../../utils/validation';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import logo from '../../assets/logo.png';

/** Helper for real-time validation feedback */
function ValidationNotice({ error, value }: { error: string | null; value: string }) {
  if (!value) return null;
  return (
    <div className={cn(
      "flex items-center gap-1.5 mt-1 text-xs font-medium transition-colors",
      error ? "text-red-500" : "text-emerald-600"
    )}>
      {error ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
      {error || "Looks good!"}
    </div>
  );
}

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onBackToLanding?: () => void;
}

export function AuthPage({ initialMode = 'login', onBackToLanding }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Hero Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={onBackToLanding} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity text-left">
            <div className="p-1 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
              <img src={logo} alt="CareConnect" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">CareConnect</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Care Assistant Finder</p>
            </div>
          </button>
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left: Info */}
          <div className="hidden lg:block space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Find Trusted <span className="text-blue-600">Care</span> Near You
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                CareConnect uses AI-powered verification to ensure every home nurse is thoroughly vetted and certified.
              </p>
            </div>

            <div className="space-y-4">
              <Feature
                icon={<Stethoscope className="w-5 h-5 text-blue-600" />}
                title="Verified Professionals"
                desc="AI analyzes certificates and IDs for authenticity"
              />
              <Feature
                icon={<Shield className="w-5 h-5 text-emerald-600" />}
                title="Secure & Private"
                desc="Role-based access with secure data handling"
              />
              <Feature
                icon={<Users className="w-5 h-5 text-purple-600" />}
                title="Community Care"
                desc="Report and help homeless individuals find shelters"
              />
            </div>


          </div>

          {/* Right: Auth Form */}
          <div>
            {mode === 'login' ? (
              <LoginForm onSwitch={() => setMode('register')} />
            ) : (
              <RegisterForm onSwitch={() => setMode('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login, loginWithPhone, loginWithGoogle, resetPassword, resendVerificationEmail } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [loginType, setLoginType] = useState<'email' | 'phone' | 'google'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [message, setMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResendVerif, setShowResendVerif] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  useEffect(() => {
    // Load saved credentials from registration or "remember me"
    const savedEmail = localStorage.getItem('login_email');
    const savedPassword = localStorage.getItem('login_password');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    
    // Safety un-stuck: reset if it takes more than 30s
    const stuckTimeout = setTimeout(() => {
      setSubmitting(false);
      setError('Process is taking longer than expected. Please check your connection or try again.');
    }, 30000);

    try {
      if (loginType === 'email') {
        const emailError = validateEmail(email);
        if (emailError) {
          setError(emailError);
          setSubmitting(false);
          clearTimeout(stuckTimeout);
          return;
        }
        console.log('[AuthPage] Calling login() in AuthContext...');
        const result = await login(email, password);
        console.log('[AuthPage] login() result:', result);
        if (!result.success) {
          if (result.error?.toLowerCase().includes('email not confirmed')) {
            setError('Please verify your email before signing in.');
            setShowResendVerif(true);
            setResendEmail(email);
          } else {
            setError(result.error || 'Login failed');
          }
        }
      } else if (loginType === 'phone') {
        if (!showOtp) {
          const phoneError = validatePhone(phone);
          if (phoneError) {
            setError(phoneError);
            setSubmitting(false);
            clearTimeout(stuckTimeout);
            return;
          }
          console.log('[AuthPage] Requesting OTP...');
          const result = await loginWithPhone(phone, '');
          if (result.success) {
            setShowOtp(true);
            setMessage('OTP sent to your phone!');
          } else {
            setError(result.error || 'Failed to send OTP');
          }
        } else {
          console.log('[AuthPage] Verifying OTP...');
          const result = await loginWithPhone(phone, otp);
          if (!result.success) setError(result.error || 'Phone login failed');
        }
      }
    } catch (err: any) {
      console.error('[AuthPage] handleSubmit catch block:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      console.log('[AuthPage] handleSubmit finally block: setting submitting=false');
      clearTimeout(stuckTimeout);
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) setError(result.error || 'Google login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-8 relative">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-3">
          <LogIn className="w-7 h-7 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm">{message}</div>
      )}

      {/* Login Type Selection */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setLoginType('email'); setShowOtp(false); setOtp(''); }}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2',
            loginType === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Mail className="w-4 h-4" /> Email
        </button>
        <button
          type="button"
          onClick={() => { setLoginType('phone'); setShowOtp(false); setOtp(''); }}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2',
            loginType === 'phone' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Phone className="w-4 h-4" /> Phone
        </button>
        <button
          type="button"
          onClick={() => { setLoginType('google'); setShowOtp(false); setOtp(''); }}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-2',
            loginType === 'google' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> Google
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loginType === 'email' && (
          <>
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            <div className="text-right -mt-2">
              <button type="button" onClick={() => { setShowForgotPassword(true); setResetEmail(email); setError(''); setMessage(''); }}
                className="text-xs text-blue-600 hover:underline cursor-pointer">Forgot password?</button>
            </div>
          </>
        )}
        {loginType === 'phone' && (
          <>
            <Input 
              label="Phone Number" 
              type="tel" 
              placeholder="10-digit mobile number" 
              value={phone} 
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
              required 
              disabled={showOtp} 
            />
            {showOtp && (
              <Input label="OTP" type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} />
            )}
          </>
        )}
        {loginType === 'google' && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-4">Click below to sign in with Google</p>
            <Button type="button" variant="outline" onClick={handleGoogleLogin} className="w-full">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg> Sign in with Google
            </Button>
          </div>
        )}
        {loginType !== 'google' && (
          <Button 
            type="submit" 
            className="w-full" 
            size="lg" 
            disabled={submitting || (loginType === 'email' && !email.includes('@'))}
          >
            {submitting ? 'Signing in...' : loginType === 'phone' && !showOtp ? 'Send OTP' : 'Sign In'}
          </Button>
        )}
      </form>

      {showResendVerif && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-sm text-amber-800 font-medium mb-2">Haven&apos;t received the code?</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-100"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              setError('');
              setMessage('');
              try {
                const result = await resendVerificationEmail(resendEmail);
                if (result.success) {
                  setMessage('Verification email resent! Please check your inbox.');
                  setShowResendVerif(false);
                } else {
                  setError(result.error || 'Failed to resend verification email');
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? 'Resending...' : 'Resend Verification Email'}
          </Button>
        </div>
      )}

      {/* Mobile demo credentials */}
      <div className="lg:hidden mt-4 bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-2 font-medium">Quick Login:</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setLoginType('email'); setEmail('admin@careconnect.com'); setPassword('admin123'); }} className="text-xs bg-white px-2 py-1 rounded-lg border cursor-pointer hover:bg-blue-50">Admin</button>
          <button onClick={() => { setLoginType('email'); setEmail('anjali@example.com'); setPassword('nurse123'); }} className="text-xs bg-white px-2 py-1 rounded-lg border cursor-pointer hover:bg-emerald-50">Nurse</button>
          <button onClick={() => { setLoginType('email'); setEmail('rahul@example.com'); setPassword('user123'); }} className="text-xs bg-white px-2 py-1 rounded-lg border cursor-pointer hover:bg-purple-50">User</button>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <button onClick={onSwitch} className="text-blue-600 font-medium hover:underline cursor-pointer">Register</button>
      </p>

      {/* Forgot Password Overlay */}
      {showForgotPassword && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-8 z-10">
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="inline-flex p-3 bg-amber-50 rounded-2xl mb-3">
                <Mail className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your email and we&apos;ll send you a reset link</p>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
            {message && <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm">{message}</div>}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setMessage('');
              if (!resetEmail) { setError('Please enter your email'); return; }
              const emailError = validateEmail(resetEmail);
              if (emailError) { setError(emailError); return; }
              setSubmitting(true);
              try {
                const result = await resetPassword(resetEmail);
                if (result.success) {
                  setMessage('Password reset email sent! Check your inbox.');
                } else {
                  setError(result.error || 'Failed to send reset email');
                }
              } finally {
                setSubmitting(false);
              }
            }} className="space-y-3">
              <Input label="Email" type="email" placeholder="you@example.com"
                value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <button onClick={() => { setShowForgotPassword(false); setError(''); setMessage(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 cursor-pointer mt-2">
              ← Back to login
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', location: '', role: 'user' as UserRole,
    shelterName: '', shelterAddress: '', shelterLat: '', shelterLng: '', shelterCapacity: '',
    specialization: '', experience: '', baseRate: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        setForm(prev => ({ ...prev, shelterLat: lat, shelterLng: lng }));
        // Reverse geocode to get address
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await resp.json();
          if (data.display_name && !form.shelterAddress) {
            setForm(prev => ({ ...prev, shelterAddress: data.display_name }));
          }
        } catch { /* ignore geocoding failure */ }
        setDetectingLocation(false);
      },
      () => {
        setError('Unable to detect location. You can enter the address manually.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailError = validateEmail(form.email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    const unMetCriteria = checkPasswordStrength(form.password).filter(c => !c.met);
    if (unMetCriteria.length > 0) {
      setError('Password does not meet all security criteria');
      return;
    }

    if (form.role === 'shelter') {
      if (!form.shelterName.trim()) { setError('Shelter name is required'); return; }
      if (!form.shelterAddress.trim()) { setError('Shelter address is required'); return; }
    }
    setSubmitting(true);
    
    // Safety un-stuck: if it takes more than 10s, un-disable the button
    const stuckTimeout = setTimeout(() => {
      setSubmitting(false);
      setError('Registration is taking longer than expected. Please check your connection or try again.');
    }, 10000);

    try {
      console.log('[AuthPage] Submitting registration for:', form.email);
      
      const sanitizedForm = {
        ...form,
        name: form.role === 'shelter' ? form.shelterName : form.name,
        location: form.role === 'shelter' ? form.shelterAddress : form.location,
        specializations: form.specialization ? [form.specialization] : [],
        experience: Number(form.experience) || 0,
        baseRate: Number(form.baseRate) || 0,
        shelterLat: form.shelterLat ? (parseFloat(form.shelterLat) || 0) : undefined,
        shelterLng: form.shelterLng ? (parseFloat(form.shelterLng) || 0) : undefined,
        shelterCapacity: form.shelterCapacity ? (parseInt(form.shelterCapacity) || 0) : undefined,
      };

      const result = await register(sanitizedForm);
      console.log('[AuthPage] Registration API result:', result);

      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.');
      } else {
        // Save credentials for convenient login later
        localStorage.setItem('login_email', form.email);
        localStorage.setItem('login_password', form.password);
        
        if (!result.session) {
          setSuccessMsg('Account created! Please check your email inbox to confirm your account, then you can sign in.');
        } else {
          setSuccessMsg('Registration successful! Redirecting you now...');
        }
      }
    } catch (err: any) {
      console.error('[AuthPage] handleSubmit catch error:', err);
      setError(err.message || 'An unexpected error occurred during registration.');
    } finally {
      console.log('[AuthPage] Registration cleanup');
      clearTimeout(stuckTimeout);
      setSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Card className="p-8">
      <div className="text-center mb-6">
        <div className={`inline-flex p-3 rounded-2xl mb-3 ${form.role === 'shelter' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          {form.role === 'shelter'
            ? <Building className="w-7 h-7 text-amber-600" />
            : <UserPlus className="w-7 h-7 text-emerald-600" />}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {form.role === 'shelter' ? 'Register Shelter' : 'Create Account'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {form.role === 'shelter' ? 'Register your shelter to receive humanitarian reports' : 'Join our healthcare community'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {/* Success: show a big confirmation and hide the form */}
      {successMsg ? (
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex p-4 bg-green-100 rounded-full mb-2">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Success!</h3>
          <p className="text-gray-600">{successMsg}</p>
          <button
            onClick={onSwitch}
            className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">I am a</label>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => update('role', 'user')}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${form.role === 'user' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
              <Users className="w-4 h-4" /> Patient
            </button>
            <button type="button" onClick={() => update('role', 'nurse')}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${form.role === 'nurse' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
              <ShieldCheck className="w-4 h-4" /> Nurse
            </button>
            <button type="button" onClick={() => update('role', 'shelter')}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${form.role === 'shelter' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
              <Building className="w-4 h-4" /> Shelter
            </button>
          </div>
        </div>

        {/* Conditional fields based on role */}
        {form.role === 'shelter' ? (
          <>
            <Input label="Shelter Name" placeholder="Sneha Bhavan Shelter" value={form.shelterName} onChange={e => update('shelterName', e.target.value)} required />
            <Input label="Address" placeholder="MG Road, Kochi, Kerala" value={form.shelterAddress} onChange={e => update('shelterAddress', e.target.value)} required />

            {/* Auto-detect location (optional) */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">GPS Location <span className="text-gray-400 font-normal">(optional)</span></label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {detectingLocation ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location...</>
                ) : form.shelterLat && form.shelterLng ? (
                  <><MapPin className="w-4 h-4 text-emerald-500" /> 📍 {parseFloat(form.shelterLat).toFixed(4)}, {parseFloat(form.shelterLng).toFixed(4)} — Click to re-detect</>
                ) : (
                  <><MapPin className="w-4 h-4" /> Auto-detect Location</>
                )}
              </button>
              {form.shelterLat && form.shelterLng && (
                <p className="text-xs text-emerald-600">✓ GPS coordinates captured</p>
              )}
            </div>

            <Input label="Capacity" type="number" placeholder="100" value={form.shelterCapacity} onChange={e => update('shelterCapacity', e.target.value)} />
            <div className="space-y-1">
              <Input label="Contact Email" type="email" placeholder="shelter@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
              <ValidationNotice error={validateEmail(form.email)} value={form.email} />
            </div>
            <div className="space-y-1">
              <Input 
                label="Contact Phone" 
                type="tel" 
                placeholder="10-digit mobile number" 
                value={form.phone} 
                onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                required 
              />
              <ValidationNotice error={validatePhone(form.phone)} value={form.phone} />
            </div>
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {(isPasswordFocused || form.password.length > 0) && (
              <PasswordStrengthIndicator password={form.password} />
            )}
          </>
        ) : (
          <>
            <div className={`p-4 rounded-xl border-l-4 mb-4 ${form.role === 'nurse' ? 'bg-emerald-50 border-emerald-400' : 'bg-blue-50 border-blue-400'}`}>
              <p className="text-sm font-medium text-gray-900">
                {form.role === 'nurse' ? 'Registering as a Professional Nurse' : 'Registering as a Patient'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {form.role === 'nurse'
                  ? 'Complete your profile information to start finding work.'
                  : 'Start booking professional home nursing services today.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
              <div className="space-y-1">
                <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                <ValidationNotice error={validateEmail(form.email)} value={form.email} />
              </div>
              <div className="space-y-1">
                <Input 
                  label="Mobile Number" 
                  type="tel" 
                  placeholder="10-digit mobile number" 
                  value={form.phone} 
                  onChange={e => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                  required 
                />
                <ValidationNotice error={validatePhone(form.phone)} value={form.phone} />
              </div>
              <Input label="City/Location" placeholder="Kochi, Kerala" value={form.location} onChange={e => update('location', e.target.value)} required />

              {form.role === 'nurse' && (
                <>
                  <Select
                    label="Primary Specialization"
                    value={form.specialization}
                    onChange={e => update('specialization', e.target.value)}
                    required
                    options={[
                      { value: '', label: 'Select specialization...' },
                      { value: 'Elderly', label: 'Elderly Care' },
                      { value: 'Post-Surgery', label: 'Post-Surgery Care' },
                      { value: 'Newborn', label: 'Newborn Care' },
                      { value: 'Palliative', label: 'Palliative Care' }
                    ]}
                  />
                  <Input
                    label="Years of Experience"
                    type="number"
                    placeholder="5"
                    value={form.experience}
                    onChange={e => update('experience', e.target.value)}
                    required
                  />
                </>
              )}
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {(isPasswordFocused || form.password.length > 0) && (
              <PasswordStrengthIndicator password={form.password} />
            )}
          </>
        )}

        <Button 
          type="submit" 
          variant={form.role === 'shelter' ? 'secondary' : form.role === 'nurse' ? 'success' : 'primary'} 
          className="w-full" 
          size="lg" 
          loading={submitting}
          disabled={!form.email.includes('@')}
        >
          {submitting ? 'Creating Account...' : form.role === 'shelter' ? 'Register Shelter' : 'Create Account'}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google Sign Up */}
      <button
        onClick={async () => {
          setError('');
          setSubmitting(true);
          try {
            const result = await loginWithGoogle(form.role);
            if (!result.success) {
              setError(result.error || 'Google login failed');
              setSubmitting(false);
            }
          } catch (err: any) {
            setError(err.message || 'An error occurred');
            setSubmitting(false);
          }
        }}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>
      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-blue-600 font-medium hover:underline cursor-pointer">Sign In</button>
      </p>
    </>
  )}
    </Card>
  );
}
