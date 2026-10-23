import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';

import jobService from '../../services/jobService';
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

  const job = app?.job ?? app?.jobDetail ?? app?.jobDTO ?? app?.applicationJob ?? app?.jobResponse ?? {};
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

const statusToCount = (apps) => {
  const list = Array.isArray(apps) ? apps : [];

  let shortlisted = 0;
  let selected = 0;

  for (const raw of list) {
    const app = normalizeApplication(raw);
    const status = String(app?.status ?? '').trim().toUpperCase();
    if (status === 'SHORTLISTED') shortlisted += 1;
    if (status === 'SELECTED') selected += 1;
  }

  return { shortlisted, selected, total: list.length };
};

const getJobId = (job) => job?.id ?? job?.jobId ?? job?.job_id;

const getJobCompany = (job) => job?.company?.name ?? job?.companyName ?? '—';

const getJobSalaryText = (job) => {
  const min = job?.salaryMin;
  const max = job?.salaryMax;

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

const statusToBadgeClass = (status) => {
  const s = String(status ?? '').trim().toUpperCase();

  if (s === 'PENDING') return 'bg-blue-900/40 text-blue-200 border-blue-800/60';
  if (s === 'SHORTLISTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';
  if (s === 'REJECTED') return 'bg-red-900/40 text-red-200 border-red-800/60';
  if (s === 'SELECTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';

  return 'bg-slate-800 text-slate-200 border-slate-700';
};

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');

    try {
      // Latest jobs (backend supports pagination/sorting via getJobs)
      const jobsPage = await jobService.getJobs({
        page: 0,
        size: 5,
        sortBy: 'createdAt',
        direction: 'desc',
      });
      setJobs(jobsPage?.content ?? []);

      const apps = await applicationService.getMyApplications();
      const list = Array.isArray(apps) ? apps : apps?.content ?? apps?.items ?? [];
      setApplications(list);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load dashboard data';
      setError(msg);
      toast.error(msg);
      setJobs([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { shortlisted, selected, total } = useMemo(
    () => statusToCount(applications),
    [applications]
  );

  const latestJobs = useMemo(() => (Array.isArray(jobs) ? jobs.slice(0, 5) : []), [jobs]);
  const latestApplications = useMemo(
    () => (Array.isArray(applications) ? applications.slice(0, 5) : []),
    [applications]
  );

  const hasJobs = latestJobs.length > 0;
  const hasApps = latestApplications.length > 0;

  const dashboardCards = [
    {
      title: 'Available Jobs',
      count: latestJobs.length,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-indigo-200">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h18" />
        </svg>
      ),
    },
    {
      title: 'Total Applications',
      count: total,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-emerald-200">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      title: 'Shortlisted',
      count: shortlisted,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-emerald-200">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      title: 'Selected',
      count: selected,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-emerald-200">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17l-5-5 1.4-1.4L12 14.2l8.6-8.6L22 7l-10 10Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Student Dashboard</h1>
          <p className="text-slate-300 mt-1">Track your job applications and career opportunities.</p>
        </header>

        {loading ? (
          <LoadingSkeleton count={8} />
        ) : error ? (
          <ErrorState
            title="Error loading dashboard"
            message={error}
            loading={loading}
            onRetry={fetchAll}
          />
        ) : null}

        {!loading && !error ? (
          <>
            {/* Dashboard Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {dashboardCards.map((c) => (
                <div
                  key={c.title}
                  className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow"
                  aria-label={c.title}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-300">{c.title}</div>
                      <div className="text-2xl font-bold text-slate-50">{c.count}</div>
                    </div>
                    <div className="shrink-0">{c.icon}</div>
                  </div>
                </div>
              ))}
            </section>

            {/* Quick Actions + Lists */}
            <section className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-50">Recent Jobs</h2>
                  <button
                    type="button"
                    onClick={() => navigate('/jobs')}
                    className="text-sm text-indigo-200 hover:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md px-2 py-1"
                    aria-label="Browse Jobs"
                  >
                    Browse Jobs
                  </button>
                </div>

                {hasJobs ? (
                  <div className="space-y-3">
                    {latestJobs.map((job) => {
                      const id = getJobId(job);
                      const companyName = getJobCompany(job);
                      const title = job?.title ?? '—';
                      const location = job?.location ?? '—';
                      const experience = job?.experience ?? '—';
                      const salaryText = getJobSalaryText(job);

                      return (
                        <article
                          key={id ?? title}
                          className="bg-slate-950/60 border border-slate-800 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-50 truncate">{title}</h3>
                              <div className="mt-1 text-sm text-slate-300">{companyName}</div>
                              <div className="mt-2 text-sm text-slate-300">
                                <div>
                                  <span className="text-slate-400">Location:</span> {location}
                                </div>
                                <div>
                                  <span className="text-slate-400">Experience:</span> {experience}
                                </div>
                                <div>
                                  <span className="text-slate-400">Salary:</span> {salaryText}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => navigate(`/jobs/${id}`)}
                              className="w-full rounded-lg px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              aria-label="View Job"
                              disabled={!id}
                            >
                              View Details
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No Jobs Available" message="Check back later for new opportunities." />
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-50">Recent Applications</h2>
                  <button
                    type="button"
                    onClick={() => navigate('/applications')}
                    className="text-sm text-indigo-200 hover:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md px-2 py-1"
                    aria-label="My Applications"
                  >
                    My Applications
                  </button>
                </div>

                {hasApps ? (
<div className="space-y-3">
                    {latestApplications.map((app) => {
                      const normalized = normalizeApplication(app);
                      const id = normalized.jobId;
                      const title = normalized.title;
                      const companyName = normalized.companyName;
                      const location = normalized.location;
                      const experience = normalized.experience;
                      const salaryText = getJobSalaryText({
                        salaryMin: normalized.salaryMin,
                        salaryMax: normalized.salaryMax,
                      });
                      const appliedDate = normalized.appliedAt;
                      const applicationStatus = normalized.status;
                      const badgeClass = statusToBadgeClass(applicationStatus);

                      return (
                        <article
                          key={normalized.id ?? `${id}-${title}-${applicationStatus}`}
                          className="bg-slate-950/60 border border-slate-800 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-50 truncate">{title}</h3>
                              <div className="mt-1 text-sm text-slate-300">{companyName}</div>
                              <div className="mt-2 text-sm text-slate-300">
                                <div>
                                  <span className="text-slate-400">Applied:</span> {formatDate(appliedDate)}
                                </div>
                                <div>
                                  <span className="text-slate-400">Location:</span> {location}
                                </div>
                                <div>
                                  <span className="text-slate-400">Experience:</span> {experience}
                                </div>
                                <div>
                                  <span className="text-slate-400">Salary:</span> {salaryText}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <span
                                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
                                aria-label={`Status: ${applicationStatus}`}
                              >
                                {String(applicationStatus).toUpperCase() || 'PENDING'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => navigate(`/jobs/${id}`)}
                              className="w-full rounded-lg px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              aria-label="View Job"
                              disabled={!id}
                            >
                              View Job
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No Applications Yet"
                    message="You haven't applied for any jobs yet."
                    actionLabel="Browse Jobs"
                    onAction={() => navigate('/jobs')}
                  />
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default React.memo(StudentDashboard);

