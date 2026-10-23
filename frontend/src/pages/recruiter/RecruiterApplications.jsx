import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from 'react-toastify';

import recruiterApplicationService from '../../services/recruiterApplicationService';
import { getResumeBlobUrl } from '../../services/resumeService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';
import EmptyState from '../../components/jobs/EmptyState';
import Pagination from '../../components/jobs/Pagination';

const statusOptions = [
  { value: '', label: 'ALL' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'SHORTLISTED', label: 'SHORTLISTED' },
  { value: 'REJECTED', label: 'REJECTED' },
  { value: 'SELECTED', label: 'SELECTED' },
];

const statusBadgeClass = (status) => {
  const s = String(status ?? '').trim().toUpperCase();

  if (s === 'PENDING') return 'bg-blue-900/40 text-blue-200 border-blue-800/60';
  if (s === 'SHORTLISTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';
  if (s === 'REJECTED') return 'bg-red-900/40 text-red-200 border-red-800/60';
  if (s === 'SELECTED') return 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60';

  return 'bg-slate-800 text-slate-200 border-slate-700';
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

const RecruiterApplications = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [applicationsPage, setApplicationsPage] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [status, setStatus] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const applications = applicationsPage?.content ?? [];
  const totalPages = applicationsPage?.totalPages ?? 0;
  const totalElements = applicationsPage?.totalElements ?? 0;

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');

try {
      const params = { page, size, sortBy: 'appliedAt', direction: 'desc' };
      if (jobId) params.jobId = jobId;
      if (status) params.status = status;

      const data = await recruiterApplicationService.getRecruiterApplications(params);
      setApplicationsPage(data ?? null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load applications';
      setError(msg);
      toast.error(msg);
      setApplicationsPage(null);
    } finally {
      setLoading(false);
    }
  }, [page, size, jobId, status]);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchApplications]);

  const filteredApplications = useMemo(() => {
    const list = Array.isArray(applications) ? applications : [];
    if (!status) return list;
    return list.filter((a) => String(a?.status ?? '').trim().toUpperCase() === status);
  }, [applications, status]);

  const [resumeLoadingId, setResumeLoadingId] = useState(null);

  const onDownloadResume = async (studentId) => {
    if (!studentId) return;
    setResumeLoadingId(studentId);
    try {
      const blobUrl = await getResumeBlobUrl(studentId);
      if (!blobUrl) {
        toast.error('Resume is not available or you do not have permission to view it.');
        return;
      }
      window.open(blobUrl, '_blank', 'noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch {
      toast.error('Failed to load resume.');
    } finally {
      setResumeLoadingId(null);
    }
  };

  const onUpdateStatus = async (applicationId, nextStatus) => {
    if (!applicationId) return;

    const ok = window.confirm(`Change status to ${nextStatus}?`);
    if (!ok) return;

    setUpdatingId(applicationId);
    setError('');
    try {
      await recruiterApplicationService.updateApplicationStatus(applicationId, nextStatus);
      toast.success(`Status updated to ${nextStatus}`);
      await fetchApplications();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to update status';
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderApplicationRow = (app) => {
    const studentId = app?.studentId;
    const studentName = app?.studentName ?? '—';
    const email = app?.studentEmail ?? '—';
    const phone = app?.studentPhone ?? '—';
    const branch = app?.studentBranch ?? '—';
    const cgpa = app?.studentCgpa ?? '—';
    const skills = app?.studentSkills ?? '';
    const skillsText = Array.isArray(skills) ? skills.join(', ') : String(skills ?? '');

    const appliedText = formatDate(app?.appliedAt);

    const applicationStatus = String(app?.status ?? 'PENDING').trim().toUpperCase();
    const badgeClass = statusBadgeClass(applicationStatus);

    const jobTitle = app?.jobTitle ?? '—';
    const resumeUrl = app?.studentResumeUrl ?? '';
    const applicationId = app?.id;

    const isUpdating = updatingId === applicationId;

    return (
      <tr key={app?.id ?? `${studentId}-${jobTitle}-${appliedText}`} className="border-t border-slate-800">
        <td className="px-4 py-3">
          <div className="font-medium text-slate-50">{studentName}</div>
          <div className="text-sm text-slate-400">{email}</div>
          <div className="text-sm text-slate-300">Phone: {phone}</div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-300">{jobTitle}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{branch}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{cgpa}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{skillsText || '—'}</td>
        <td className="px-4 py-3 text-sm text-slate-300">{appliedText}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}
            aria-label={`Status: ${applicationStatus}`}
          >
            {applicationStatus}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (!studentId) return;
                navigate(`/recruiter/candidates/${studentId}`);
              }}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="View Profile"
              disabled={!studentId}
            >
              View Profile
            </button>

            {resumeUrl ? (
              <button
                type="button"
                onClick={() => onDownloadResume(studentId)}
                disabled={resumeLoadingId === studentId}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 text-center font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
                aria-label="Download Resume"
              >
                {resumeLoadingId === studentId ? 'Loading...' : 'Resume'}
              </button>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {applicationStatus !== 'SHORTLISTED' ? (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(applicationId, 'SHORTLISTED')}
                  className="px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                  aria-label="Shortlist"
                  disabled={!applicationId || isUpdating}
                >
                  Shortlist
                </button>
              ) : null}

              {applicationStatus !== 'REJECTED' ? (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(applicationId, 'REJECTED')}
                  className="px-2 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/40 text-red-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-300"
                  aria-label="Reject"
                  disabled={!applicationId || isUpdating}
                >
                  Reject
                </button>
              ) : null}

              {applicationStatus !== 'SELECTED' ? (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(applicationId, 'SELECTED')}
                  className="px-2 py-2 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/40 text-emerald-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  aria-label="Select"
                  disabled={!applicationId || isUpdating}
                >
                  Select
                </button>
              ) : null}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Recruiter Applications</h1>
          <p className="text-slate-300 mt-1">
            {jobId ? `Candidates for job ID: ${jobId}` : 'All candidates across your jobs'}
          </p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="status" className="block text-sm text-slate-300 font-medium">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
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

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setPage(0)}
                className="w-full rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Refresh"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <LoadingSkeleton count={8} />
          ) : error ? (
            <ErrorState
              title="Error loading applications"
              message={error}
              loading={loading}
              onRetry={fetchApplications}
            />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              title="No Applications"
              message="No students have applied for this job yet."
              actionLabel="Back to Jobs"
              onAction={() => navigate('/recruiter/jobs')}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-left">
                  <thead>
                    <tr className="text-slate-300 text-sm">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Job</th>
                      <th className="px-4 py-3">Branch</th>
                      <th className="px-4 py-3">CGPA</th>
                      <th className="px-4 py-3">Skills</th>
                      <th className="px-4 py-3">Applied Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>{filteredApplications.map(renderApplicationRow)}</tbody>
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

export default React.memo(RecruiterApplications);
