import React from 'react';

/**
 * EmptyState
 * Reusable empty state component for the Job module.
 */
const EmptyState = ({
  title = 'No jobs found',
  message = 'Try changing your search or filter criteria.',
  actionLabel = 'Clear Filters',
  onAction,
}) => {
  const showAction = typeof onAction === 'function';

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full flex items-center justify-center p-6"
    >
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
          {/* Illustration placeholder */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-7 h-7 text-slate-400"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 10h10"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6h6l2 4H7l2-4Z"
            />
          </svg>
        </div>

        <h3 className="mt-4 text-lg font-semibold text-slate-50">{title}</h3>
        <p className="mt-2 text-sm text-slate-300">{message}</p>

        {showAction ? (
          <button
            type="button"
            onClick={() => onAction?.()}
            className="mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default React.memo(EmptyState);

