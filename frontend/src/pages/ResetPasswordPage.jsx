import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '../services/authService';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordOk = newPassword.length >= 8;
  const matchOk = newPassword === confirmPassword && passwordOk;
  const canSubmit = token.trim().length > 0 && matchOk && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!token.trim()) toast.error('Reset token is required.');
      else if (!passwordOk) toast.error('Password must be at least 8 characters.');
      else if (newPassword !== confirmPassword) toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      setSuccess(true);
      toast.success('Password reset successfully. You can now sign in.');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Reset failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            Reset <span className="text-indigo-400">password</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">Enter your reset token and a new password.</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center space-y-5" role="status" aria-live="polite">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">Password Reset Successful</h3>
                <p className="text-sm text-slate-300">Password reset successfully. You can now sign in.</p>
              </div>
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="token" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Reset Token
                </label>
                <input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste the token from your email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 px-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                  aria-label="Reset token"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-10 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                    aria-label="New password"
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

              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                    aria-label="Confirm new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-1 font-medium text-indigo-300 hover:text-indigo-200"
              >
                <ArrowLeft className="h-4 w-4" /> Request new token
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 font-medium text-indigo-300 hover:text-indigo-200"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
