import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';

import applicationService from '../../services/applicationService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';
import EmptyState from '../../components/jobs/EmptyState';

// Normalize an application from the backend into a single shape the UI can render.
// The live backend returns ApplicationDTO with FLAT fields (jobTitle, jobLocation,
// jobSalaryMin, jobSalaryMax, jobExperience, jobStatus, companyName, appliedAt).
// We prefer those, and fall back to the nested `job.*` shape for robustness.
const normalizeApplication = (app) => {
  if (!app) return null;

  const job = app?.job ?? app?.companyJob ?? app?.applicationJob ?? app?.jobDTO ?? app?.jobDetail ?? app?.jobResponse ?? {};
  const company = job?.company ?? app?.company ?? {};

  return {
    // Identity
    id: app?.id ?? null,
    jobId: app?.jobId ?? app?.job_id ?? job?.id ?? null,

    // Status
    status: app?.status ?? app?.applicationStatus ?? app?.state ?? 'PENDING',

    // Job title (flat preferred)
    title: app?.jobTitle ?? job?.title ?? app?.title ?? '—',

    // Company (flat preferred)
    companyName: app?.companyName ?? company?.name ?? job?.companyName ?? '—',

    // Location (flat preferred)
    location: app?.jobLocation ?? job?.location ?? app?.location ?? '—',

    // Experience (flat preferred)
    experience: app?.jobExperience ?? job?.experience ?? app?.experience ?? '—',

    // Salary (flat preferred)
    salaryMin: app?.jobSalaryMin ?? job?.salaryMin ?? app?.salaryMin,
    salaryMax: app?.jobSalaryMax ?? job?.salaryMax ?? app?.salaryMax,

    // Applied date (flat DTO uses `appliedAt`)
    appliedAt: app?.appliedAt ?? app?.appliedDate ?? app?.createdAt ?? app?.applied_on ?? null,
  };
};

const statusToBadge = (status) => {
  const s = String(status ?? '').trim().toUpperCase();

  if (s === 'PENDING') {
    return {
      label: 'PENDING',
      className: 'bg-blue-900/40 text-blue-200 border-blue-800/60',
    };
  }

  if (s === 'SHORTLISTED') {
    return {
      label: 'SHORTLISTED',
      className: 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60',
    };
  }

  if (s === 'REJECTED') {
    return {
      label: 'REJECTED',
      className: 'bg-red-900/40 text-red-200 border-red-800/60',
    };
  }

  if (s === 'SELECTED') {
    return {
      label: 'SELECTED',
      className: 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60',
    };
  }

  return {
    label: s || '—',
    className: 'bg-slate-800 text-slate-200 border-slate-700',
  };
};

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

const getSalaryText = (min, max) => {
  const nMin = Number(min);
  const nMax = Number(max);

  if (!Number.isFinite(nMin) && !Number.isFinite(nMax)) return '—';

  const toLPA = (v) => {
    const lpa = Math.round((v / 100000) * 10) / 10;
    return Number.isInteger(lpa) ? `${lpa}` : lpa.toFixed(1);
  };

  const safeMin = Number.isFinite(nMin) ? `₹${toLPA(nMin)} LPA` : '₹—';
  const safeMax = Number.isFinite(nMax) ? `₹${toLPA(nMax)} LPA` : '₹—';

  return `${safeMin} – ${safeMax}`;
};

const MyApplications = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);

  const fetchApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await applicationService.getMyApplications();
      // Defensive: backend may return array or wrapped object
      const list = Array.isArray(data) ? data : data?.content ?? data?.items ?? [];
      setApplications(list);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load applications';
      setError(msg);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const withdrawSupported = useMemo(() => {
    // Our applicationService withdrawApplication may be a TODO rejecting Promise.
    // We only render the Withdraw UI if it's a function.
    return typeof applicationService?.withdrawApplication === 'function';
  }, []);

  const onWithdraw = async (application) => {
    const applicationId = application?.id;
    if (!applicationId) return;

    try {
      await applicationService.withdrawApplication(applicationId);
      toast.success('Application withdrawn');
      await fetchApplications();
    } catch (e) {
      const msg = e?.message || 'Failed to withdraw application';
      toast.error(msg);
    }
  };

  const hasApplications = applications && applications.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">My Applications</h1>
          <p className="text-slate-300 mt-1">Track your job applications.</p>
        </header>

        {loading ? (
          <LoadingSkeleton count={6} />
        ) : error ? (
          <ErrorState
            title="Error loading applications"
            message={error}
            loading={loading}
            onRetry={fetchApplications}
          />
        ) : hasApplications ? (
          <section aria-label="Applications list">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{applications.map((app) => {
                const normalized = normalizeApplication(app);

                const jobId = normalized.jobId;
                const jobTitle = normalized.title;
                const companyName = normalized.companyName;

                const location = normalized.location;
                const salaryText = getSalaryText(normalized.salaryMin, normalized.salaryMax);
                const experience = normalized.experience;

                const appliedDate = normalized.appliedAt;
                const applicationStatus = normalized.status;

                const badge = statusToBadge(applicationStatus);

                return (
                  <article
                    key={app?.id ?? `${jobId}-${jobTitle}-${applicationStatus}`}
                    className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
                    aria-label={`Application: ${jobTitle}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-slate-300 truncate">{companyName}</div>
                        <h2 className="text-lg font-semibold text-slate-50 truncate">{jobTitle}</h2>
                        <div className="mt-2 text-sm text-slate-300">
                          <div>
                            <span className="text-slate-400">Location:</span> {location}
                          </div>
                          <div>
                            <span className="text-slate-400">Salary:</span> {salaryText}
                          </div>
                          <div>
                            <span className="text-slate-400">Experience:</span> {experience}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
                          aria-label={`Status: ${badge.label}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-slate-400">
                      <div>
                        <span className="text-slate-300">Applied Date:</span> {formatDate(appliedDate)}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
<button
                        type="button"
                        onClick={() => {
                          if (!jobId) return;
                          navigate(`/jobs/${jobId}`);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label="View Job"
                      >
                        View Job
                      </button>

                      {/* Backend only allows withdrawing PENDING applications. */}
                      {withdrawSupported &&
                      String(applicationStatus ?? '').trim().toUpperCase() === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => onWithdraw(app)}
                          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                          aria-label="Withdraw"
                        >
                          Withdraw
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="mt-6">
            <EmptyState title="No Applications Yet" message="You haven't applied for any jobs yet." />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MyApplications);

