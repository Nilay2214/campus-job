import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { requestPasswordReset } from '../services/authService';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success('If that email is registered, a reset link has been sent.');
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Request failed';
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
            Forgot <span className="text-indigo-400">password?</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email to receive a password reset token.
          </p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4" role="status" aria-live="polite">
              <div className="text-slate-200">
                If that email address is registered, a password reset token has been sent.
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 font-medium text-indigo-300 hover:text-indigo-200"
              >
                Back to Sign In <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ) : (
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

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  'Send Reset Token'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-medium text-indigo-300 hover:text-indigo-200"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 font-medium text-indigo-300 hover:text-indigo-200"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
