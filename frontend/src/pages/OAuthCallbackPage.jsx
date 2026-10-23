import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error) {
      toast.error(decodeURIComponent(error) || 'Google authentication failed');
      navigate('/login', { replace: true });
      return;
    }

    if (token && role) {
      try {
        login(token, role, { role });
        toast.success('Welcome back!');
        if (role === 'RECRUITER') {
          navigate('/recruiter/dashboard', { replace: true });
        } else if (role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        toast.error('Failed to initialize session: ' + (err.message || 'Unknown error'));
        navigate('/login', { replace: true });
      }
    } else {
      toast.error('Invalid authentication response from Google');
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-300"
      role="status"
      aria-live="polite"
    >
      <Spinner />
      <span className="text-base font-medium text-slate-200">Completing Google authentication...</span>
      <p className="text-xs text-slate-500">Please wait while we verify your account.</p>
    </div>
  );
};

export default OAuthCallbackPage;
