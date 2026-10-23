import React from 'react';

const variants = {
  default: 'bg-slate-800 text-slate-200 border-slate-700',
  indigo: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  red: 'bg-red-500/15 text-red-200 border-red-500/30',
  violet: 'bg-violet-500/15 text-violet-200 border-violet-500/30',
};

const Badge = ({ variant = 'default', className = '', children, ...props }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
