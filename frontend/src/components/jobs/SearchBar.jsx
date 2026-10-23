import React from 'react';

/**
 * SearchBar
 * Purely presentational controlled component.
 *
 * Collects search input and triggers callbacks.
 */
const SearchBar = ({
  title,
  location,
  onTitleChange,
  onLocationChange,
  onSearch,
  onReset,
  loading = false,
}) => {
  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onSearch?.();
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
        {/* Job Title */}
        <div>
          <label htmlFor="job-title" className="sr-only">
            Job Title
          </label>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 bg-slate-950 text-slate-300"
            >
              {/* Search icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z"
                />
              </svg>
            </span>
            <input
              id="job-title"
              name="title"
              type="text"
              value={title ?? ''}
              onChange={(e) => onTitleChange?.(e?.target?.value)}
              placeholder="Job Title"
              aria-label="Job Title"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="job-location" className="sr-only">
            Location
          </label>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 bg-slate-950 text-slate-300"
            >
              {/* Location pin icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11a2 2 0 100-4 2 2 0 000 4z"
                />
              </svg>
            </span>
            <input
              id="job-location"
              name="location"
              type="text"
              value={location ?? ''}
              onChange={(e) => onLocationChange?.(e?.target?.value)}
              placeholder="Location"
              aria-label="Location"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Search jobs"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Reset search"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default React.memo(SearchBar);

