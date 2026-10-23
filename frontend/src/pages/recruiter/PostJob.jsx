import React, { useEffect, useMemo, useState } from 'react';

import { toast } from 'react-toastify';

import { createJob } from '../../services/recruiterJobService';
import { getAllCompanies } from '../../services/companyService';

const MIN_TITLE_LENGTH = 3;

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

// Backend JobRequest expects deadline as LocalDateTime (ISO-8601 with time).
// HTML date inputs only provide 'YYYY-MM-DD', so we append end-of-day time.
const toLocalDateTime = (dateOnly) => {
  if (!dateOnly) return null;
  return `${dateOnly}T23:59:59`;
};

const PostJob = () => {
  const [saving, setSaving] = useState(false);

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

const [error, setError] = useState('');

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const data = await getAllCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to load companies';
      setError(msg);
      toast.error(msg);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, value) => {
    setError('');
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validation = useMemo(() => {
    const title = String(form.title ?? '').trim();
    if (!title) return 'Job Title is required.';
    if (title.length < MIN_TITLE_LENGTH) return `Job Title must be at least ${MIN_TITLE_LENGTH} characters.`;

// Backend JobRequest expects companyId (Long), not companyName.
    const companyId = String(form.companyId ?? '').trim();
    if (!companyId) return 'Company ID is required.';

    const location = String(form.location ?? '').trim();
    if (!location) return 'Location is required.';

    const salaryMin = Number(form.salaryMin);
    if (!Number.isFinite(salaryMin) || salaryMin < 0) return 'Salary Min must be >= 0.';

    const salaryMax = Number(form.salaryMax);
    if (!Number.isFinite(salaryMax)) return 'Salary Max is required.';
    if (salaryMax < salaryMin) return 'Salary Max must be >= Salary Min.';

    const exp = String(form.experience ?? '').trim();
    if (!exp) return 'Experience is required.';

    const skills = String(form.requiredSkills ?? '').trim();
    if (!skills) return 'Required Skills is required.';

    const deadlineOk = isValidFutureOrToday(form.deadline);
    if (!deadlineOk) return 'Application Deadline must be today or future.';

    return '';
  }, [form]);

  const canSubmit = !saving && !validation;

const resetForm = () => {
    setForm({
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
    });
    setError('');
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();

    if (!canSubmit) {
      if (validation) toast.error(validation);
      return;
    }

    setSaving(true);
    setError('');

    try {
const payload = {
        title: String(form.title ?? '').trim(),
        // Backend JobRequest expects companyId (Long), not companyName.
        companyId: Number(form.companyId),
        location: String(form.location ?? '').trim(),
        experience: String(form.experience ?? '').trim(),
        employmentType: form.employmentType,
        workMode: form.workMode,
        salaryMin: Number(form.salaryMin),
        salaryMax: Number(form.salaryMax),
requiredSkills: String(form.requiredSkills ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(', '),
        description: String(form.description ?? '').trim(),
// Backend JobRequest uses 'eligibility' (not responsibilities/qualifications/benefits).
        eligibility: String(form.qualifications ?? '').trim(),
        // Backend JobRequest expects deadline as LocalDateTime (ISO-8601 with time).
        deadline: toLocalDateTime(form.deadline),
      };

      await createJob(payload);
      toast.success('Job posted successfully');
      resetForm();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to post job';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Post New Job</h1>
          <p className="text-slate-300 mt-1">Create a job listing for recruiters to match students.</p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-5 sm:p-6">
          {error ? (
            <div role="alert" aria-live="assertive" className="mb-4 bg-red-950/40 border border-red-900 rounded-lg p-3 text-red-100">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} aria-label="Post job form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Job Title */}
              <div className="md:col-span-1">
                <label htmlFor="title" className="block text-sm text-slate-300 font-medium">
                  Job Title<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Job title"
                  placeholder="Software Engineer"
                  required
                />
              </div>

{/* Company */}
              <div className="md:col-span-1">
                <label htmlFor="companyId" className="block text-sm text-slate-300 font-medium">
                  Company<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <select
                  id="companyId"
                  name="companyId"
                  value={form.companyId}
                  onChange={(e) => setField('companyId', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Company"
                  required
                  disabled={companiesLoading}
                >
                  <option value="">
                    {companiesLoading ? 'Loading companies...' : 'Select a company'}
                  </option>
                  {(companies ?? []).map((c) => (
                    <option key={c?.id} value={c?.id ?? ''}>
                      {c?.name ?? `Company #${c?.id}`}
                    </option>
                  ))}
                </select>
                {companies.length === 0 && !companiesLoading ? (
                  <p className="mt-1 text-xs text-amber-300">
                    No companies available. Create one in Company Profile first.
                  </p>
                ) : null}
              </div>

              {/* Location */}
              <div className="md:col-span-1">
                <label htmlFor="location" className="block text-sm text-slate-300 font-medium">
                  Location<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Location"
                  placeholder="Bengaluru"
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
                  name="experience"
                  value={form.experience}
                  onChange={(e) => setField('experience', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Experience"
                  placeholder="1-3 Years"
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
                  name="salaryMin"
                  type="number"
                  min={0}
                  value={form.salaryMin}
                  onChange={(e) => setField('salaryMin', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Salary minimum"
                  placeholder="500000"
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
                  name="salaryMax"
                  type="number"
                  min={0}
                  value={form.salaryMax}
                  onChange={(e) => setField('salaryMax', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Salary maximum"
                  placeholder="1200000"
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
                  name="requiredSkills"
                  value={form.requiredSkills}
                  onChange={(e) => setField('requiredSkills', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Required skills"
                  placeholder="React, Spring Boot, MySQL"
                  required
                />
              </div>

              {/* Job Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm text-slate-300 font-medium">
                  Job Description<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className="mt-1 w-full min-h-[92px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Job description"
                  required
                />
              </div>

              {/* Responsibilities */}
              <div className="md:col-span-2">
                <label htmlFor="responsibilities" className="block text-sm text-slate-300 font-medium">
                  Responsibilities
                </label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
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
                  name="qualifications"
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
                  name="benefits"
                  value={form.benefits}
                  onChange={(e) => setField('benefits', e.target.value)}
                  className="mt-1 w-full min-h-[92px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Benefits"
                />
              </div>

              {/* Application Deadline */}
              <div className="md:col-span-2">
                <label htmlFor="deadline" className="block text-sm text-slate-300 font-medium">
                  Application Deadline<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setField('deadline', e.target.value)}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Application deadline"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
                aria-disabled={saving}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={!canSubmit}
                aria-disabled={!canSubmit}
                aria-busy={saving}
                className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {saving ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PostJob);

