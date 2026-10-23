import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, LogIn, Briefcase, ArrowRight, Phone, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { firebaseAuth, googleProvider } from '../firebase';

const LoginPage = () => {
  const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'mobile'
  
  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Mobile OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRoleRedirect = (role) => {
    if (role === 'RECRUITER') {
      navigate('/recruiter/dashboard');
    } else if (role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'demo-api-key') {
      toast.error('Firebase is not configured yet. Please add your VITE_FIREBASE_API_KEY to frontend/.env');
      return;
    }
    setGoogleLoading(true);
    try {
      const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const response = await api.post('/api/auth/firebase', { idToken });
      const { token, role } = response.data;
      const userEmail = userCredential.user.email || email;

      login(token, role, { email: userEmail, role });
      toast.success('Welcome back!');
      handleRoleRedirect(role);
    } catch (error) {
      if (error?.code === 'auth/popup-closed-by-user') {
        toast.info('Google sign-in was cancelled');
      } else if (error?.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (error?.code === 'auth/network-request-failed') {
        toast.error('Network error during Google sign-in. Please check your connection.');
      } else {
        const msg =
          error?.message ||
          error?.details?.error ||
          error?.details?.message ||
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Google authentication failed. Please try again.';
        toast.error(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, role } = response.data;
      login(token, role, { email, role });
      toast.success('Welcome back!');
      handleRoleRedirect(role);
    } catch (error) {
      const msg =
        error?.message ||
        error?.details?.error ||
        error?.details?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Invalid email or password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      toast.error('Please enter a valid mobile number (e.g. +91 9876543210)');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await api.post('/api/auth/mobile/request-otp', { phoneNumber: phoneNumber.trim() });
      toast.success(response.data.message || 'OTP sent successfully!');
      setOtpSent(true);
      setResendCooldown(60);
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to request OTP. Please try again.';
      toast.error(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setVerifyLoading(true);
    try {
      const response = await api.post('/api/auth/mobile/verify-otp', {
        phoneNumber: phoneNumber.trim(),
        otp: otp.trim(),
      });
      const { token, role } = response.data;
      login(token, role, { email: phoneNumber, role });
      toast.success('Mobile verification successful!');
      handleRoleRedirect(role);
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'OTP verification failed. Please try again.';
      toast.error(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            Campus <span className="text-indigo-400">Job</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to your Campus Job account</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading || otpLoading || verifyLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/90 py-2.5 px-4 font-semibold text-slate-100 shadow-md transition hover:bg-slate-800 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          {/* Switcher Tabs */}
          <div className="mt-6 mb-5 grid grid-cols-2 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setOtpSent(false);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                authMethod === 'email'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Email Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('mobile')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                authMethod === 'mobile'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              Mobile OTP
            </button>
          </div>

          {/* EMAIL LOGIN FORM */}
          {authMethod === 'email' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-indigo-300 hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In with Email
                  </>
                )}
              </button>
            </form>
          )}

          {/* MOBILE OTP FORM */}
          {authMethod === 'mobile' && (
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label htmlFor="phoneNumber" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="phoneNumber"
                        type="tel"
                        required
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Enter your 10-digit number or full international format (+country code).
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || googleLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-60"
                  >
                    {otpLoading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        Send Verification Code
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Code sent to <strong className="text-white">{phoneNumber}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp('');
                        }}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        <ArrowLeft className="h-3 w-3" /> Edit
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-slate-300">
                      Enter 6-Digit OTP
                    </label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="otp"
                        type="text"
                        required
                        maxLength={6}
                        pattern="\d{6}"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full tracking-widest text-center text-lg font-mono rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Didn&apos;t receive the code?</span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-500 font-medium">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={otpLoading}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-300 hover:text-indigo-200"
                      >
                        <RefreshCw className="h-3 w-3" /> Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={verifyLoading || otp.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-60"
                  >
                    {verifyLoading ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        Verify & Sign In
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-slate-400">Don&apos;t have an account?</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 font-medium text-indigo-300 hover:text-indigo-200"
            >
              Register <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
