import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from 'react-toastify';

import jobService from '../../services/jobService';
import { applyToJob } from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';


const formatSalary = (min, max) => {
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

const formatRequiredSkills = (skills) => {
  if (!skills) return [];
  const s = String(skills);
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
};

const formatDeadline = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatStatus = (status) => {
  const s = String(status ?? '').trim();
  return s || 'ACTIVE';
};

const JobDetails = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState(null);

  const { role: currentRole } = useAuth();
  const isStudent = currentRole === 'STUDENT';

  const fetchJob = async () => {
    if (!jobId) return;

    setLoading(true);
    setError('');

    try {
      const data = await jobService.getJobById(jobId);
      setJob(data ?? null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load job details';
      setError(msg);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

const status = formatStatus(job?.status);
  const isActive = status === 'ACTIVE';
  const requiredSkills = formatRequiredSkills(job?.requiredSkills);

  const salaryText = formatSalary(job?.salaryMin, job?.salaryMax);

  // Backend JobDetailDTO exposes the company as a nested object:
  //   company: { id, name, industry, website, location, description, logo, createdAt }
  const companyName = job?.company?.name ?? '—';

const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Only STUDENT users may apply to jobs. Recruiters/admins get a read-only view.
  const canApply = isStudent;
  const applyDisabled = !isActive || loading || applying || applied || !canApply;

  const applyButtonText = useMemo(() => {
    if (!isActive) return 'Applications Closed';
    if (applied) return 'Applied Successfully';
    if (applying) return 'Applying...';
    return 'Apply Now';
  }, [isActive, applied, applying]);

  const onApply = async () => {
    if (applyDisabled) return;
    if (!job?.id) return;

setApplying(true);
    try {
      await applyToJob(job.id);
      toast.success('Applied successfully');
      setApplied(true);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to apply for this job';
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  return (

    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Back"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>

{/* Sticky-ish apply panel on desktop (STUDENT only) */}
          {canApply && (
          <div className="hidden md:block">
            <div className="w-80 border border-slate-800 bg-slate-900 rounded-xl p-4 sticky top-6">
              <div className="text-sm text-slate-300">Application</div>

              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                    isActive
                      ? 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {isActive ? 'Open' : 'Closed'}
                </span>
              </div>

              <button
                type="button"
                disabled={applyDisabled}
                onClick={onApply}
                className={`mt-4 w-full rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                  isActive && !applied && !applying
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-50'
                }`}
                aria-busy={applying}
                aria-disabled={applyDisabled}
aria-label={applyButtonText}
              >
                {applyButtonText}
              </button>
            </div>
          </div>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton count={6} />
        ) : error ? (
          <ErrorState
            title="Error loading job"
            message={error}
            loading={loading}
            onRetry={fetchJob}
          />
        ) : job ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_20rem] gap-6">
            {/* Details */}
            <div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6">
                <div className="flex items-start gap-4">
<div className="w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <span className="text-slate-300 text-xs font-semibold">
                      {companyName
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-300 truncate">{companyName}</div>
                    <h1 className="text-2xl font-bold text-slate-50 truncate">{job?.title ?? '—'}</h1>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border bg-indigo-900/40 text-indigo-200 border-indigo-800/60 px-2.5 py-1 text-xs font-medium">
                        {job?.employmentType ?? '—'}
                      </span>
                      <span className="inline-flex items-center rounded-full border bg-emerald-900/40 text-emerald-200 border-emerald-800/60 px-2.5 py-1 text-xs font-medium">
                        {job?.workMode ?? '—'}
                      </span>
                      <span className="inline-flex items-center rounded-full border bg-amber-900/40 text-amber-200 border-amber-800/60 px-2.5 py-1 text-xs font-medium">
                        {job?.experience ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key info */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-sm text-slate-300">
                    <div className="text-slate-400">Salary</div>
                    <div className="text-slate-50 font-semibold">{salaryText}</div>
                  </div>
                  <div className="text-sm text-slate-300">
                    <div className="text-slate-400">Location</div>
                    <div className="text-slate-50 font-semibold">{job?.location ?? '—'}</div>
                  </div>
                  <div className="text-sm text-slate-300">
                    <div className="text-slate-400">Application Deadline</div>
                    <div className="text-slate-50 font-semibold">{formatDeadline(job?.deadline)}</div>
                  </div>
                  <div className="text-sm text-slate-300">
                    <div className="text-slate-400">Job Status</div>
                    <div className="text-slate-50 font-semibold">{status}</div>
                  </div>
                </div>

                {/* Required skills */}
                <div className="mt-5">
                  <h2 className="text-sm font-semibold text-slate-300">Required Skills</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {requiredSkills.length > 0 ? (
                      requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs text-slate-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </div>
                </div>

{/* Description */}
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-50">Job Description</h2>
                  <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">
                    {job?.description ?? '—'}
                  </p>
                </div>

                {/* Eligibility */}
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-slate-50">Eligibility</h2>
                  <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">
                    {job?.eligibility ?? '—'}
                  </p>
                </div>
              </div>
            </div>

{/* Mobile apply panel (STUDENT only) */}
            {canApply && (
            <div className="md:hidden">
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-4">
                <div className="text-sm text-slate-300">Application</div>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      isActive
                        ? 'bg-emerald-900/40 text-emerald-200 border-emerald-800/60'
                        : 'bg-slate-800 text-slate-200 border-slate-700'
                    }`}
                  >
                    {isActive ? 'Open' : 'Closed'}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={applyDisabled}
                  onClick={onApply}
                  className={`mt-4 w-full rounded-lg px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isActive && !applied && !applying
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-50'
                  }`}
                  aria-busy={applying}
                  aria-disabled={applyDisabled}
aria-label={applyButtonText}
                >
                  {applyButtonText}
                </button>
              </div>
            </div>
            )}
          </div>
        ) : (
          <ErrorState
            title="Job not found"
            message="The requested job does not exist or is no longer available."
            loading={loading}
            onRetry={fetchJob}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(JobDetails);

