import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';

import {
  deleteRecruiterJob,
  getRecruiterJobs,
} from '../../services/recruiterJobService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';
import EmptyState from '../../components/jobs/EmptyState';
import Pagination from '../../components/jobs/Pagination';

const statusOptions = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'CLOSED', label: 'CLOSED' },
  { value: 'DRAFT', label: 'DRAFT' },
];

const sortOptions = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'deadline', label: 'Oldest (deadline)' },
  { value: 'salaryMin', label: 'Salary' },
  { value: 'title', label: 'Title' },
];

const ManageJobs = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [jobsPage, setJobsPage] = useState(null);

  // Query controls
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [direction, setDirection] = useState('desc');
  const [status, setStatus] = useState('ACTIVE');

  const [searchTitle, setSearchTitle] = useState('');

  const queryParams = useMemo(() => {
    const params = {
      page,
      size,
      sortBy,
      direction,
    };

    if (status) params.status = status;
    if (searchTitle.trim()) params.title = searchTitle.trim();

    return params;
  }, [page, size, sortBy, direction, status, searchTitle]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');

    const res = await getRecruiterJobs(queryParams);
    setJobsPage(res ?? null);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetchJobs();
      } catch (e) {
        if (cancelled) return;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          'Failed to load jobs';
        setError(msg);
        setJobsPage(null);
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const jobs = jobsPage?.content ?? [];
  const totalPages = jobsPage?.totalPages ?? 0;
  const totalElements = jobsPage?.totalElements ?? 0;

  const onDelete = async (jobId) => {
    if (!jobId) return;

    const confirmed = window.confirm('Are you sure you want to delete this job?');
    if (!confirmed) return;

    setLoading(true);
    setError('');

    try {
      await deleteRecruiterJob(jobId);
      toast.success('Job deleted successfully');
      await fetchJobs();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to delete job';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetToFirstPage = () => {
    setPage(0);
  };

  const applySearch = () => {
    resetToFirstPage();
  };

  const handleRetry = async () => {
    setError('');
    try {
      await fetchJobs();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load jobs';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderJobRow = (job) => {
    const jobId = job?.id ?? job?.jobId;

    const salaryMin = job?.salaryMin;
    const salaryMax = job?.salaryMax;
    const salaryText = Number.isFinite(Number(salaryMin)) || Number.isFinite(Number(salaryMax))
      ? `${salaryMin ?? '—'} - ${salaryMax ?? '—'}`
      : '—';

    const createdAt = job?.createdAt ?? job?.postedAt ?? job?.created_date;
    const createdText = createdAt
      ? new Date(createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';

    const applicationsCount = job?.applicationsCount ?? job?.appliedCount ?? job?.applications ?? null;

    return (
      <tr key={jobId ?? job?.title} className="border-t border-slate-800">
        <td className="px-4 py-3">
          <div className="font-medium text-slate-50">{job?.title ?? '—'}</div>
          <div className="text-sm text-slate-400">{job?.company?.name ?? job?.companyName ?? '—'}</div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-300">{job?.location ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{job?.experience ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{job?.employmentType ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{job?.workMode ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{salaryText}</td>
        <td className="px-4 py-3 text-sm text-slate-300">
          {applicationsCount != null ? String(applicationsCount) : '—'}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex items-center rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-200 bg-slate-800">
            {job?.status ?? 'ACTIVE'}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-slate-300">{createdText}</td>
        <td className="px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => navigate(`/recruiter/jobs/${jobId}`)}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="View"
            >
              View
            </button>

            <button
              type="button"
              onClick={() => navigate(`/recruiter/jobs/${jobId}/edit`)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Edit"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => navigate(`/recruiter/jobs/${jobId}/applications`)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Applicants"
            >
              Applicants
            </button>

            <button
              type="button"
              onClick={() => onDelete(jobId)}
              className="px-3 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/40 text-red-100 font-medium focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Delete"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Jobs</h1>
          <p className="text-slate-300 mt-1">Search, filter, sort, and manage your posted jobs.</p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label htmlFor="searchTitle" className="block text-sm text-slate-300 font-medium">
                Search by Job Title
              </label>
              <input
                id="searchTitle"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch();
                }}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Search job title"
                placeholder="e.g., Software Engineer"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm text-slate-300 font-medium">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  resetToFirstPage();
                }}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Filter status"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sortBy" className="block text-sm text-slate-300 font-medium">
                Sort
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setDirection(e.target.value === 'title' ? 'asc' : 'desc');
                  resetToFirstPage();
                }}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Sort by"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={applySearch}
                className="w-full rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Apply search"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <LoadingSkeleton count={8} />
          ) : error ? (
            <ErrorState
              title="Error loading jobs"
              message={error}
              loading={loading}
              onRetry={handleRetry}
            />
          ) : jobs.length === 0 ? (
            <EmptyState title="No Jobs Posted" message="Create your first job posting." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead>
                    <tr className="text-slate-300 text-sm">
                      <th className="px-4 py-3">Job Title</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Experience</th>
                      <th className="px-4 py-3">Employment</th>
                      <th className="px-4 py-3">Work Mode</th>
                      <th className="px-4 py-3">Salary</th>
                      <th className="px-4 py-3">Applications</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{jobs.map(renderJobRow)}</tbody>
                </table>
              </div>

              <div className="mt-6">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={size}
                  totalElements={totalElements}
                  loading={loading}
                  onPageChange={(nextPage) => setPage(nextPage)}
                  onPageSizeChange={(nextSize) => {
                    setPage(0);
                    setSize(nextSize);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ManageJobs);

