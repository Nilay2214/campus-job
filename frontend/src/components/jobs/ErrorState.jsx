import React from 'react';

/**
 * ErrorState
 * Presentational reusable error UI.
 */
const ErrorState = ({
  title = 'Something went wrong',
  message = "We couldn't load the available jobs.",
  onRetry,
  loading = false,
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full flex items-center justify-center p-4"
    >
      <div className="max-w-xl w-full bg-red-950/40 border border-red-900 rounded-xl shadow-sm p-6">
        <div className="flex items-start gap-3">
          {/* Error icon */}
          <div
            className="w-10 h-10 rounded-lg bg-red-900/40 border border-red-800/60 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="w-5 h-5 text-red-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4.455A9 9 0 1119.938 7.545 9 9 0 015.062 18.455z"
              />
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-red-100">{title}</h3>
            <p className="mt-1 text-sm text-red-100/80">{message}</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onRetry?.()}
                disabled={loading}
                className="rounded-lg px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-300"
                aria-label="Retry loading jobs"
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ErrorState);

