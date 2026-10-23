import React, { useMemo } from 'react';

const DEFAULT_FIELDS = [
  { key: 'fullName', label: 'Full Name', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'phone', label: 'Phone', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'branch', label: 'Branch', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'cgpa', label: 'CGPA', check: (v) => String(v ?? '').toString().trim() !== '' },
  { key: 'graduationYear', label: 'Graduation Year', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'skills', label: 'Skills', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'linkedinUrl', label: 'LinkedIn', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'githubUrl', label: 'GitHub', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'portfolioUrl', label: 'Portfolio', check: (v) => Boolean(String(v ?? '').trim()) },
  { key: 'resumeUploaded', label: 'Resume Uploaded', check: (v) => Boolean(v) },
];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const getMessage = (pct) => {
  if (pct >= 100) return 'Your profile is complete.';
  if (pct >= 80) return 'Almost there.';
  if (pct >= 50) return 'Improve your profile.';
  return 'Complete your profile to improve your hiring chances.';
};

const completionColor = (pct) => {
  if (pct >= 100) return { ring: 'text-emerald-300', bar: 'bg-emerald-600' };
  if (pct >= 80) return { ring: 'text-indigo-300', bar: 'bg-indigo-600' };
  if (pct >= 50) return { ring: 'text-amber-300', bar: 'bg-amber-600' };
  return { ring: 'text-red-300', bar: 'bg-red-600' };
};

const ProgressRing = ({ pct, ringClass }) => {
  const radius = 34;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const clamped = clamp(pct, 0, 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative w-20 h-20" aria-label={`Profile completion ${clamped}%`}>
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(148,163,184,0.25)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={ringClass}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-slate-50">{clamped}%</span>
      </div>
    </div>
  );
};

const ProfileCompletionCard = ({
  profile,
  onEditProfile,
  title = 'Profile Completion',
  ariaLabel = 'Profile completion widget',
}) => {
  const safeProfile = profile ?? {};

  const completion = useMemo(() => {
    let completed = 0;

    const items = DEFAULT_FIELDS.map((f) => {
      const value = safeProfile?.[f.key];
      const ok = f.check(value);
      if (ok) completed += 1;

      return {
        key: f.key,
        label: f.label,
        ok,
      };
    });

    const pct = DEFAULT_FIELDS.length ? Math.round((completed / DEFAULT_FIELDS.length) * 100) : 0;

    return {
      completed,
      pct,
      items,
      message: getMessage(pct),
      color: completionColor(pct),
    };
  }, [safeProfile]);

  const { pct, message, items, color } = completion;

  return (
    <section
      className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-5"
      aria-label={ariaLabel}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
          <p className="mt-1 text-sm text-slate-300">{message}</p>
        </div>

        <ProgressRing pct={pct} ringClass={color.ring} />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-300">Progress</span>
          <span className="text-sm text-slate-200 font-medium">{pct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true">
          <div className={`${color.bar} h-2`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-200">Checklist</h3>
        <ul className="mt-3 space-y-2" aria-label="Profile checklist">
          {items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">{item.label}</span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                  item.ok
                    ? 'bg-emerald-900/40 border-emerald-800/60 text-emerald-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                aria-label={item.ok ? `${item.label} completed` : `${item.label} missing`}
              >
                {item.ok ? '✔ Completed' : '⚪ Missing'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => onEditProfile?.()}
          className="w-full rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Edit Profile"
        >
          Edit Profile
        </button>
      </div>
    </section>
  );
};

export default React.memo(ProfileCompletionCard);

