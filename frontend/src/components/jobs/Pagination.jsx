import React from 'react';

/**
 * Helper to compute up to 5 visible page numbers.
 * Always includes first/last when applicable and uses ellipsis for gaps.
 *
 * Returns an array like: [1,2,3,4,5] or [1,2,3,'…',10]
 */
const getVisiblePages = (currentPage, totalPages) => {
  const safeCurrent = Number.isFinite(currentPage) ? currentPage : 0;
  const safeTotal = Number.isFinite(totalPages) ? totalPages : 0;

  if (safeTotal <= 5) {
    return Array.from({ length: safeTotal }, (_, i) => i + 1);
  }

  // Strategy: show current page centered-ish with max 5 numbers.
  const current = Math.min(Math.max(safeCurrent + 1, 1), safeTotal); // convert 0-index -> 1-index

  const start = Math.max(1, current - 2);
  const end = Math.min(safeTotal, start + 4);

  const adjustedStart = Math.max(1, end - 4);

  const pages = [];

  // First segment
  pages.push(1);

  // Middle/ellipsis
  if (adjustedStart > 2) pages.push('…');

  for (let p = adjustedStart; p <= end; p += 1) {
    if (p !== 1 && p !== safeTotal) pages.push(p);
  }

  // Last segment
  if (end < safeTotal - 1) pages.push('…');

  pages.push(safeTotal);

  // De-dup (in case of edge overlaps)
  return pages.filter((v, idx) => v !== '…' || idx === pages.findIndex((x) => x === '…'));
};

/**
 * Pagination
 * Presentational pagination controls only.
 */
const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalElements,
  loading = false,
  onPageChange,
  onPageSizeChange,
}) => {
  const cp = Number.isFinite(currentPage) ? currentPage : 0; // expected 0-index
  const tp = Number.isFinite(totalPages) ? totalPages : 0;

  const pages = getVisiblePages(cp, tp);

  const isFirst = cp <= 0;
  const isLast = cp + 1 >= tp;

  const pageLabel = tp > 0 ? `${cp + 1} / ${tp}` : '0 / 0';

  const pageSizeOptions = [5, 10, 20, 50, 100];

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      {/* Page size */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-300">Page Size</span>
        <select
          value={pageSize ?? 10}
          onChange={(e) => onPageSizeChange?.(Number(e?.target?.value))}
          disabled={loading}
          className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          aria-label="Page size"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Page info */}
      <div className="text-sm text-slate-400">
        {totalElements != null ? (
          <span>
            Total Records: <span className="text-slate-300">{totalElements}</span>
          </span>
        ) : null}
        {totalPages > 0 ? (
          <span>
            {' '}• Page <span className="text-slate-300 font-semibold">{pageLabel}</span>
          </span>
        ) : null}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange?.(cp - 1)}
          disabled={isFirst || loading}
          aria-label="Previous page"
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Previous
        </button>

        {/* Page numbers (scrollable on mobile) */}
        <div
          className="flex items-center gap-2 overflow-x-auto max-w-[240px] sm:max-w-none"
          role="navigation"
          aria-label="Page numbers"
        >
          {pages.map((p, idx) => {
            if (p === '…') {
              return (
                <span key={`ellipsis-${idx}`} className="text-slate-500 px-1">
                  …
                </span>
              );
            }

            const zeroIndexed = Number(p) - 1;
            const isActive = zeroIndexed === cp;

            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange?.(zeroIndexed)}
                aria-label={`Page ${p}`}
                aria-current={isActive ? 'page' : undefined}
                disabled={loading}
                className={`px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange?.(cp + 1)}
          disabled={isLast || loading}
          aria-label="Next page"
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default React.memo(Pagination);

