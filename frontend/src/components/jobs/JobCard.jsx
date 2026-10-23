import React from 'react';

/**
 * Helper: format salary range into Indian-style LPA.
 * Example: 500000 -> ₹5 LPA
 *
 * @param {number|string|null|undefined} value
 * @returns {string}
 */
const formatSalaryToLPA = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';

  // Convert INR to LPA: 1 LPA = 100,000
  const lpa = Math.round((n / 100000) * 10) / 10;

  // If it's an integer, print without decimals.
  const lpaText = Number.isInteger(lpa) ? String(lpa) : lpa.toFixed(1);
  return `₹${lpaText} LPA`;
};

/**
 * Helper: format ISO date string into '18 Sep 2026'.
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Helper: render a badge.
 * Presentational only.
 */
const Badge = ({ children, tone = 'indigo' }) => {
  const toneStyles =
    tone === 'emerald'
      ? 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60'
      : tone === 'amber'
        ? 'bg-amber-900/40 text-amber-200 border-amber-800/60'
        : 'bg-indigo-900/40 text-indigo-200 border-indigo-800/60';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneStyles}`}
    >
      {children}
    </span>
  );
};

/**
 * Helper: company initials placeholder.
 */
const getInitials = (name) => {
  const safe = (name ?? '').trim();
  if (!safe) return 'CO';

  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[1]?.[0] ?? '' : (parts[0]?.[1] ?? '');
  const initials = `${first}${second}`.toUpperCase();
  return initials || 'CO';
};

/**
 * JobCard
 * Presentational component only.
 */
const JobCard = ({ job, onViewDetails, onApply, loading = false, isStudent = false }) => {
  const companyName = job?.company?.name ?? 'Company';
  const logoUrl = job?.company?.logo;

  const salaryMinText = formatSalaryToLPA(job?.salaryMin);
  const salaryMaxText = formatSalaryToLPA(job?.salaryMax);

  const deadlineText = formatDate(job?.deadline);

  const requiredSkills = job?.requiredSkills
    ? String(job.requiredSkills)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const status = job?.status ?? 'ACTIVE';
  const isApplyDisabled = status !== 'ACTIVE' || loading;

  return (
    <article
      className="group bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-4"
      aria-label={`Job: ${job?.title ?? 'Untitled'}`}
    >
      <header className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${companyName} logo`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-slate-300 text-xs font-semibold">
              {getInitials(companyName)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm text-slate-300 truncate">{companyName}</div>
          <h2 className="text-lg font-semibold text-slate-50 truncate">
            {job?.title ?? '-'}
          </h2>
        </div>
      </header>

      <section className="mt-3 grid gap-2 text-sm text-slate-300">
        <div>
          <span className="text-slate-400">Experience:</span>{' '}
          <span className="text-slate-50">{job?.experience ?? '—'}</span>
        </div>

        <div>
          <span className="text-slate-400">Salary:</span>{' '}
          <span className="text-slate-50">
            {salaryMinText} – {salaryMaxText}
          </span>
        </div>

        <div>
          <span className="text-slate-400">Location:</span>{' '}
          <span className="text-slate-50">{job?.location ?? '—'}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {job?.employmentType ? (
            <Badge tone="indigo">{job.employmentType}</Badge>
          ) : null}
          {job?.workMode ? <Badge tone="emerald">{job.workMode}</Badge> : null}
          {job?.experience ? <Badge tone="amber">{job.experience}</Badge> : null}
        </div>

        {requiredSkills.length > 0 ? (
          <div>
            <span className="text-slate-400">Skills:</span>{' '}
            <div className="mt-1 flex flex-wrap gap-2">
              {requiredSkills.slice(0, 8).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-slate-400">Skills:</span>{' '}
            <span className="text-slate-50">—</span>
          </div>
        )}

        <div>
          <span className="text-slate-400">Deadline:</span>{' '}
          <span className="text-slate-50">{deadlineText}</span>
        </div>
      </section>

<footer className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onViewDetails?.(job?.id)}
          className={`px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            isStudent ? 'flex-1' : 'w-full'
          }`}
        >
          View Details
        </button>

        {isStudent ? (
          <button
            type="button"
            onClick={() => onApply?.(job?.id)}
            disabled={isApplyDisabled}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium disabled:opacity-60 disabled:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-disabled={isApplyDisabled}
          >
            Apply
          </button>
        ) : null}
      </footer>
    </article>
  );
};

export default React.memo(JobCard);

