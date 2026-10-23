import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from 'react-toastify';

import { getRecruiterJob, updateRecruiterJob } from '../../services/recruiterJobService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';

const MIN_TITLE_LENGTH = 3;

const statusOptions = ['ACTIVE', 'CLOSED', 'DRAFT'];

const isValidFutureOrToday = (value) => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  return target.getTime() >= today.getTime();
};

const toSkillString = (value) => {
  if (value == null) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value);
};

// Backend JobRequest expects deadline as LocalDateTime (ISO-8601 with time).
// Convert a date-only (YYYY-MM-DD) to end-of-day LocalDateTime string.
const toLocalDateTime = (dateOnly) => {
  if (!dateOnly) return null;
  return `${dateOnly}T23:59:59`;
};

// Convert a LocalDateTime/ISO string to YYYY-MM-DD for the <input type="date">.
const toDateOnly = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fromSkillString = (value) => {
  const raw = String(value ?? '');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
};

const EditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

const [form, setForm] = useState({
    title: '',
    companyId: '',
    location: '',
    experience: '',
    employmentType: 'FULL_TIME',
    workMode: 'ONSITE',
    salaryMin: '',
    salaryMax: '',
    requiredSkills: '',
    description: '',
    responsibilities: '',
    qualifications: '',
    benefits: '',
    deadline: '',
    status: 'ACTIVE',
  });

  const setField = (key, value) => {
    setError('');
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyPopulation = (job) => {
const payload = {
      title: String(job?.title ?? ''),
      companyId: job?.company?.id ?? job?.companyId ?? '',
      companyName: job?.company?.name ?? job?.companyName ?? '',
      location: String(job?.location ?? ''),
      experience: String(job?.experience ?? ''),
      employmentType: String(job?.employmentType ?? 'FULL_TIME'),
      workMode: String(job?.workMode ?? 'ONSITE'),
      salaryMin:
        job?.salaryMin == null ? '' : Number.isFinite(Number(job.salaryMin)) ? String(job.salaryMin) : '',
      salaryMax:
        job?.salaryMax == null ? '' : Number.isFinite(Number(job.salaryMax)) ? String(job.salaryMax) : '',
      requiredSkills: toSkillString(job?.requiredSkills ?? job?.skills),
      description: String(job?.description ?? job?.jobDescription ?? ''),
      responsibilities: String(job?.responsibilities ?? ''),
      qualifications: String(job?.qualifications ?? ''),
      benefits: String(job?.benefits ?? ''),
      deadline: toDateOnly(job?.deadline),
      status: String(job?.status ?? 'ACTIVE'),
    };

    setForm((prev) => ({
      ...prev,
      title: payload.title,
      companyId: payload.companyId,
      location: payload.location,
      experience: payload.experience,
      employmentType: payload.employmentType,
      workMode: payload.workMode,
      salaryMin: payload.salaryMin,
      salaryMax: payload.salaryMax,
      requiredSkills: payload.requiredSkills,
      description: payload.description,
      responsibilities: payload.responsibilities,
      qualifications: payload.qualifications,
      benefits: payload.benefits,
      deadline: payload.deadline,
      status: payload.status,
    }));
  };

  const fetchJob = async () => {
    if (!jobId) return;

    setLoading(true);
    setError('');
    setNotFound(false);

    try {
      const data = await getRecruiterJob(jobId);
      if (!data) {
        setNotFound(true);
        return;
      }
      applyPopulation(data);
    } catch (e) {
      const msg =
        e?.response?.status === 404
          ? 'Job not found'
          : e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to load job';

      setError(msg);

      if (e?.response?.status === 404) setNotFound(true);

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const validation = useMemo(() => {
    const title = String(form.title ?? '').trim();
    if (!title) return 'Job Title is required.';
    if (title.length < MIN_TITLE_LENGTH) return `Job Title must be at least ${MIN_TITLE_LENGTH} characters.`;

    const location = String(form.location ?? '').trim();
    if (!location) return 'Location is required.';

    const salaryMin = Number(form.salaryMin);
    if (!Number.isFinite(salaryMin) || salaryMin < 0) return 'Salary Min must be >= 0.';

    const salaryMax = Number(form.salaryMax);
    if (!Number.isFinite(salaryMax)) return 'Salary Max is required.';
    if (salaryMax < salaryMin) return 'Salary Max must be >= Salary Min.';

    const deadlineOk = isValidFutureOrToday(form.deadline);
    if (!deadlineOk) return 'Application Deadline must be today or future.';

    return '';
  }, [form]);

  const canSubmit = !loading && !validation && !!jobId;

  const resetForm = () => {
    toast.info('Form reset');
    fetchJob();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!canSubmit) {
      if (validation) toast.error(validation);
      return;
    }

    setLoading(true);
    setError('');

    try {
const payload = {
        title: String(form.title ?? '').trim(),
        companyId: Number(form.companyId),
        location: String(form.location ?? '').trim(),
        experience: String(form.experience ?? '').trim(),
        employmentType: String(form.employmentType ?? 'FULL_TIME'),
        workMode: String(form.workMode ?? 'ONSITE'),
        salaryMin: Number(form.salaryMin),
        salaryMax: Number(form.salaryMax),
        requiredSkills: fromSkillString(form.requiredSkills),
        description: String(form.description ?? '').trim(),
        responsibilities: String(form.responsibilities ?? '').trim(),
        qualifications: String(form.qualifications ?? '').trim(),
        benefits: String(form.benefits ?? '').trim(),
        deadline: toLocalDateTime(form.deadline),
        status: String(form.status ?? 'ACTIVE'),
      };

      await updateRecruiterJob(jobId, payload);
      toast.success('Job updated successfully');
      navigate('/recruiter/manage-jobs');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update job';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.title) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <LoadingSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (error && notFound) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <ErrorState title="Job Not Found" message={error} loading={loading} onRetry={fetchJob} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Edit Job</h1>
          <p className="text-slate-300 mt-1">Update job details and status.</p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-5 sm:p-6">
          {error ? (
            <div role="alert" aria-live="assertive" className="mb-4 bg-red-950/40 border border-red-900 rounded-lg p-3">
              <div className="font-semibold text-red-100">Error</div>
              <div className="mt-1 text-sm text-red-100/90">{error}</div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} aria-label="Edit job form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Title */}
              <div className="md:col-span-1">
                <label htmlFor="title" className="block text-sm text-slate-300 font-medium">
                  Job Title<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Job title"
                  required
                  minLength={MIN_TITLE_LENGTH}
                />
              </div>

              {/* Location */}
              <div className="md:col-span-1">
                <label htmlFor="location" className="block text-sm text-slate-300 font-medium">
                  Location<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="location"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Location"
                  required
                />
              </div>

              {/* Experience */}
              <div className="md:col-span-1">
                <label htmlFor="experience" className="block text-sm text-slate-300 font-medium">
                  Experience<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="experience"
                  value={form.experience}
                  onChange={(e) => setField('experience', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Experience"
                  required
                />
              </div>

              {/* Employment Type */}
              <div>
                <label htmlFor="employmentType" className="block text-sm text-slate-300 font-medium">
                  Employment Type
                </label>
                <select
                  id="employmentType"
                  value={form.employmentType}
                  onChange={(e) => setField('employmentType', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Employment type"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>

              {/* Work Mode */}
              <div>
                <label htmlFor="workMode" className="block text-sm text-slate-300 font-medium">
                  Work Mode
                </label>
                <select
                  id="workMode"
                  value={form.workMode}
                  onChange={(e) => setField('workMode', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Work mode"
                >
                  <option value="ONSITE">On Site</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              {/* Salary Min */}
              <div>
                <label htmlFor="salaryMin" className="block text-sm text-slate-300 font-medium">
                  Salary Min<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="salaryMin"
                  type="number"
                  min={0}
                  value={form.salaryMin}
                  onChange={(e) => setField('salaryMin', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Salary min"
                  required
                />
              </div>

              {/* Salary Max */}
              <div>
                <label htmlFor="salaryMax" className="block text-sm text-slate-300 font-medium">
                  Salary Max<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="salaryMax"
                  type="number"
                  min={0}
                  value={form.salaryMax}
                  onChange={(e) => setField('salaryMax', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Salary max"
                  required
                />
              </div>

              {/* Required Skills */}
              <div className="md:col-span-2">
                <label htmlFor="requiredSkills" className="block text-sm text-slate-300 font-medium">
                  Required Skills<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="requiredSkills"
                  value={form.requiredSkills}
                  onChange={(e) => setField('requiredSkills', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Required skills"
                  required
                  placeholder="React, Spring Boot, MySQL"
                />
              </div>

              {/* Job Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm text-slate-300 font-medium">
                  Job Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="mt-1 w-full min-h-[92px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Job description"
                />
              </div>

              {/* Responsibilities */}
              <div className="md:col-span-2">
                <label htmlFor="responsibilities" className="block text-sm text-slate-300 font-medium">
                  Responsibilities
                </label>
                <textarea
                  id="responsibilities"
                  value={form.responsibilities}
                  onChange={(e) => setField('responsibilities', e.target.value)}
                  className="mt-1 w-full min-h-[92px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Responsibilities"
                />
              </div>

              {/* Qualifications */}
              <div className="md:col-span-2">
                <label htmlFor="qualifications" className="block text-sm text-slate-300 font-medium">
                  Qualifications
                </label>
                <textarea
                  id="qualifications"
                  value={form.qualifications}
                  onChange={(e) => setField('qualifications', e.target.value)}
                  className="mt-1 w-full min-h-[92px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Qualifications"
                />
              </div>

              {/* Benefits */}
              <div className="md:col-span-2">
                <label htmlFor="benefits" className="block text-sm text-slate-300 font-medium">
                  Benefits
                </label>
                <textarea
                  id="benefits"
                  value={form.benefits}
                  onChange={(e) => setField('benefits', e.target.value)}
                  className="mt-1 w-full min-h-[92px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Benefits"
                />
              </div>

              {/* Deadline */}
              <div>
                <label htmlFor="deadline" className="block text-sm text-slate-300 font-medium">
                  Application Deadline<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setField('deadline', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Application deadline"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm text-slate-300 font-medium">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Job status"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {validation ? (
              <div className="mt-4 text-sm text-red-200" role="alert" aria-live="polite">
                {validation}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
                aria-label="Reset"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => navigate('/recruiter/manage-jobs')}
                disabled={loading}
                className="rounded-lg px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium border border-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-60"
                aria-label="Cancel"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Save changes"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EditJob);
