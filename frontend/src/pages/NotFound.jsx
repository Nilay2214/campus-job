import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NotFound
 * 404 fallback page shown for unknown routes.
 */
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-8 h-8 text-slate-400"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6M15 9l-6 6" />
          </svg>
        </div>

        <h1 className="mt-5 text-3xl font-bold">404</h1>
        <p className="mt-2 text-slate-300">Page not found</p>
        <p className="mt-1 text-sm text-slate-400">
          The page you are looking for does not exist or has been moved.
        </p>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mt-6 rounded-lg px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Go to dashboard"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default React.memo(NotFound);
