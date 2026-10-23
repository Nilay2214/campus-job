import React from 'react';
import { Card } from './Card';

/**
 * Reusable statistics card.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {number|string} props.value
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.iconClass]
 * @param {string} [props.hint]
 */
const StatCard = ({ title, value = 0, icon, iconClass = 'text-indigo-300', hint }) => {
  return (
    <Card className="p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-50">{value ?? 0}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {icon ? (
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950 border border-slate-800 ${iconClass}`}>
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default StatCard;
