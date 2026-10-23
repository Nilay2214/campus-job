import React from 'react';

/**
 * LoadingSkeleton
 * Presentational-only skeleton placeholders for the Job list.
 */
const LoadingSkeleton = ({ count = 6 }) => {
  const skeletonCount = Number.isFinite(count) ? count : 6;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading jobs"
      className="mt-2"
    >
      <span className="sr-only">Loading available jobs...</span>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: Math.min(Math.max(skeletonCount, 0), 50) }, (_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-slate-900 border border-slate-800 rounded-xl p-4"
          >
            {/* Company header */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-800" />
              <div className="min-w-0 flex-1">
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-3" />
                <div className="h-6 bg-slate-800 rounded w-5/6" />
              </div>
            </div>

            {/* Job fields */}
            <div className="mt-4 grid gap-2">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-11/12" />
              <div className="h-4 bg-slate-800 rounded w-10/12" />
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-6 w-24 rounded-full bg-slate-800" />
              ))}
            </div>

            {/* Skills / Deadline */}
            <div className="mt-3 grid gap-2">
              <div className="h-4 bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-800 rounded w-5/6" />
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-2">
              <div className="h-10 bg-slate-800 rounded-lg w-1/2" />
              <div className="h-10 bg-slate-800 rounded-lg w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(LoadingSkeleton);

