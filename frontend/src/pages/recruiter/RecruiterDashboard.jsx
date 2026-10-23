import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';

import { Briefcase, Users, FileText, TrendingUp } from 'lucide-react';

import recruiterJobService from '../../services/recruiterJobService';
import recruiterApplicationService from '../../services/recruiterApplicationService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';
import EmptyState from '../../components/jobs/EmptyState';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusBadgeClass = (status) => {
  const s = String(status ?? '').trim().toUpperCase();
  if (s === 'PENDING') return 'bg-blue-900/40 text-blue-200 border-blue-800/60';
  if (s === 'SHORTLISTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';
  if (s === 'REJECTED') return 'bg-red-900/40 text-red-200 border-red-800/60';
  if (s === 'SELECTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';
  return 'bg-slate-800 text-slate-200 border-slate-700';
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [jobsPage, appsPage] = await Promise.all([
        recruiterJobService.getRecruiterJobs({ page: 0, size: 100, sortBy: 'createdAt', direction: 'desc' }),
        recruiterApplicationService.getRecruiterApplications({ page: 0, size: 100, sortBy: 'appliedAt', direction: 'desc' }),
      ]);

      setJobs(jobsPage?.content ?? []);
      setApplications(appsPage?.content ?? []);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load recruiter dashboard';
      setError(msg);
      toast.error(msg);
      setJobs([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const counts = useMemo(() => {
    const totalJobs = Array.isArray(jobs) ? jobs.length : 0;
    const activeJobs = (Array.isArray(jobs) ? jobs : []).filter(
      (j) => String(j?.status ?? 'ACTIVE').trim().toUpperCase() === 'ACTIVE'
    ).length;
    const totalApplications = Array.isArray(applications) ? applications.length : 0;
    const shortlistedCandidates = (Array.isArray(applications) ? applications : []).filter(
      (a) => String(a?.status ?? '').trim().toUpperCase() === 'SHORTLISTED'
    ).length;

    return { totalJobs, activeJobs, totalApplications, shortlistedCandidates };
  }, [jobs, applications]);

  const hasJobs = Array.isArray(jobs) && jobs.length > 0;
  const hasApplications = Array.isArray(applications) && applications.length > 0;

  const latestJobs = useMemo(() => (Array.isArray(jobs) ? jobs.slice(0, 5) : []), [jobs]);
  const latestApplications = useMemo(() => (Array.isArray(applications) ? applications.slice(0, 5) : []), [applications]);

  const dashboardCards = [
    { title: 'Total Jobs Posted', count: counts.totalJobs, icon: <Briefcase className="h-5 w-5 text-indigo-300" /> },
    { title: 'Active Jobs', count: counts.activeJobs, icon: <FileText className="h-5 w-5 text-emerald-300" /> },
    { title: 'Total Applications', count: counts.totalApplications, icon: <Users className="h-5 w-5 text-amber-300" /> },
    { title: 'Shortlisted', count: counts.shortlistedCandidates, icon: <TrendingUp className="h-5 w-5 text-sky-300" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Recruiter Dashboard</h1>
          <p className="text-slate-300 mt-1">Manage jobs and review applications.</p>
        </header>

        {loading ? (
          <LoadingSkeleton count={8} />
        ) : error ? (
          <ErrorState
            title="Error loading recruiter dashboard"
            message={error}
            loading={loading}
            onRetry={fetchData}
          />
        ) : (
          <>
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

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-50">Recent Jobs</h2>
                  <button
                    type="button"
                    onClick={() => navigate('/recruiter/jobs')}
                    className="text-sm text-indigo-200 hover:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md px-2 py-1"
                    aria-label="Manage Jobs"
                  >
                    Manage Jobs
                  </button>
                </div>

                {hasJobs ? (
                  <div className="space-y-3">
                    {latestJobs.map((job) => {
                      const id = job?.id;
                      const title = job?.title ?? '—';
                      const location = job?.location ?? '—';
                      const employmentType = job?.employmentType ?? '—';
                      const status = job?.status ?? 'ACTIVE';

                      return (
                        <article
                          key={id ?? title}
                          className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                          aria-label={`Job: ${title}`}
                        >
                          <h3 className="font-semibold text-slate-50 truncate">{title}</h3>
                          <div className="mt-1 text-sm text-slate-300">
                            <div>Location: {location}</div>
                            <div>Employment: {employmentType}</div>
                            <div>Status: {status}</div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => id && navigate(`/recruiter/jobs/${id}/edit`)}
                              className="flex-1 rounded-lg px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              aria-label="Edit job"
                              disabled={!id}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => id && navigate(`/recruiter/jobs/${id}/applications`)}
                              className="flex-1 rounded-lg px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                              aria-label="View applicants"
                              disabled={!id}
                            >
                              Applicants
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No jobs yet"
                    message="Post a job to start receiving applications."
                    actionLabel="Post New Job"
                    onAction={() => navigate('/recruiter/jobs/new')}
                  />
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-slate-50">Recent Applications</h2>
                  <button
                    type="button"
                    onClick={() => navigate('/recruiter/applications')}
                    className="text-sm text-indigo-200 hover:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md px-2 py-1"
                    aria-label="View Applications"
                  >
                    View All
                  </button>
                </div>

                {hasApplications ? (
                  <div className="space-y-3">
                    {latestApplications.map((app) => {
                      const studentName = app?.studentName ?? '—';
                      const jobTitle = app?.jobTitle ?? '—';
                      const appliedDate = app?.appliedAt ?? null;
                      const status = String(app?.status ?? 'PENDING').trim().toUpperCase();

                      return (
                        <article
                          key={app?.id ?? `${studentName}-${jobTitle}-${appliedDate}`}
                          className="bg-slate-950/60 border border-slate-800 rounded-lg p-4"
                          aria-label={`Application from ${studentName}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-50 truncate">{studentName}</h3>
                              <div className="mt-1 text-sm text-slate-300">{jobTitle}</div>
                              <div className="mt-1 text-sm text-slate-300">
                                Applied: {formatDate(appliedDate)}
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
                            >
                              {status}
                            </span>
                          </div>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                app?.studentId && navigate(`/recruiter/candidates/${app.studentId}`)
                              }
                              className="w-full rounded-lg px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                              aria-label="Review candidate"
                              disabled={!app?.studentId}
                            >
                              Review
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No applications yet"
                    message="Your posted jobs haven't received any applications."
                  />
                )}
              </div>
            </section>

            <section className="mt-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-slate-50">Quick Actions</h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/recruiter/jobs/new')}
                    className="rounded-lg px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 text-left"
                    aria-label="Post New Job"
                  >
                    Post New Job
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/recruiter/jobs')}
                    className="rounded-lg px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 text-left"
                    aria-label="Manage Jobs"
                  >
                    Manage Jobs
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/recruiter/applications')}
                    className="rounded-lg px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 text-left"
                    aria-label="View Applications"
                  >
                    View Applications
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/recruiter/profile')}
                    className="rounded-lg px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 text-left"
                    aria-label="Company Profile"
                  >
                    Company Profile
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(RecruiterDashboard);
