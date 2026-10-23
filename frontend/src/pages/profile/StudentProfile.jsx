import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  getStudentProfile,
  saveStudentProfile,
} from '../../services/studentProfileService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';

const currentYear = new Date().getFullYear();

const isValidUrl = (value) => {
  if (!value) return false;
  try {
    // Accept both with and without protocol by normalizing.
    const v = String(value).trim();
    const normalized = v.match(/^https?:\/\//i) ? v : `https://${v}`;
    // eslint-disable-next-line no-new
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
};

const isValidPhone = (value) => {
  const s = String(value ?? '').trim();
  return /^\d{10}$/.test(s);
};

const isValidCgpa = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  return n >= 0 && n <= 10;
};

const isValidGraduationYear = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= currentYear && n <= currentYear + 10;
};

const safeString = (v) => (v == null ? '' : String(v));

const StudentProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    branch: '',
    cgpa: '',
    graduationYear: '',
    skills: '',
    linkedInUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    address: '',
    aboutMe: '',
  });

  const [saving, setSaving] = useState(false);

  const patchFromProfile = (profile) => {
    const p = profile ?? {};

    setForm({
      fullName: safeString(p?.fullName ?? p?.name ?? ''),
      email: safeString(p?.email ?? ''),
phone: safeString(p?.phoneNumber ?? p?.phone ?? ''),
      branch: safeString(p?.branch ?? ''),
      cgpa: p?.cgpa ?? p?.CGPA ?? '',
      graduationYear: p?.graduationYear ?? p?.gradYear ?? '',
      skills:
        typeof p?.skills === 'string'
          ? p.skills
          : Array.isArray(p?.skills)
            ? p.skills.join(', ')
            : '',
      linkedInUrl: safeString(p?.linkedInUrl ?? p?.linkedin ?? ''),
      githubUrl: safeString(p?.githubUrl ?? p?.github ?? ''),
      portfolioUrl: safeString(p?.portfolioUrl ?? p?.portfolio ?? ''),
      address: safeString(p?.address ?? ''),
      aboutMe: safeString(p?.aboutMe ?? p?.about ?? ''),
    });
  };

  const fetchProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const profile = await getStudentProfile();

      // If profile doesn't exist, backend may return null/empty object.
      if (!profile || Object.keys(profile).length === 0) {
        setForm((prev) => ({ ...prev, email: prev.email }));
        return;
      }

      patchFromProfile(profile);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requiredNameOk = form.fullName.trim().length > 0;
const phoneOk = form.phone.trim().length === 0 ? false : isValidPhone(form.phone);
  const cgpaOk = form.cgpa === '' ? false : isValidCgpa(form.cgpa);
  const gradYearOk =
    form.graduationYear === '' ? false : isValidGraduationYear(form.graduationYear);

  const optionalUrlOk = (value) => {
    const v = String(value ?? '').trim();
    if (!v) return true;
    return isValidUrl(v);
  };

  const urlsOk =
    optionalUrlOk(form.linkedInUrl) &&
    optionalUrlOk(form.githubUrl) &&
    optionalUrlOk(form.portfolioUrl);

  const canSave = requiredNameOk && phoneOk && cgpaOk && gradYearOk && urlsOk && !saving;

  const validationMessage = useMemo(() => {
    if (!requiredNameOk) return 'Full Name is required.';
    if (!phoneOk) return 'Phone Number must be exactly 10 digits.';
    if (!cgpaOk) return 'CGPA must be between 0 and 10.';
    if (!gradYearOk) return `Graduation Year must be between ${currentYear} and ${currentYear + 10}.`;
    if (!optionalUrlOk(form.linkedInUrl)) return 'LinkedIn URL is invalid.';
    if (!optionalUrlOk(form.githubUrl)) return 'GitHub URL is invalid.';
    if (!optionalUrlOk(form.portfolioUrl)) return 'Portfolio URL is invalid.';
    return '';
  }, [requiredNameOk, phoneOk, cgpaOk, gradYearOk, form.linkedInUrl, form.githubUrl, form.portfolioUrl]);

  const onReset = () => {
    fetchProfile();
  };

  const onSave = async () => {
    if (!canSave) {
      if (validationMessage) toast.error(validationMessage);
      return;
    }

    setSaving(true);

    try {
// Backend StudentProfileRequest expects:
// - phone (String), not phoneNumber
// - cgpa (String), not number
// - graduationYear (String), not number
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        branch: form.branch.trim(),
        cgpa: String(form.cgpa),
        graduationYear: String(form.graduationYear),
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .join(', '),
        linkedInUrl: form.linkedInUrl.trim() || null,
        githubUrl: form.githubUrl.trim() || null,
        portfolioUrl: form.portfolioUrl.trim() || null,
        address: form.address.trim(),
        aboutMe: form.aboutMe.trim(),
      };

      await saveStudentProfile(payload);
      toast.success('Profile saved successfully');
      await fetchProfile();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to save profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <LoadingSkeleton count={10} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <ErrorState
            title="Error loading profile"
            message={error}
            loading={loading}
            onRetry={fetchProfile}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Student Profile</h1>
          <p className="text-slate-300 mt-1">View and update your student profile.</p>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-5 sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
            aria-label="Student profile form"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="md:col-span-1">
                <label htmlFor="fullName" className="block text-sm text-slate-300 font-medium">
                  Full Name<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Full name"
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="md:col-span-1">
                <label htmlFor="email" className="block text-sm text-slate-300 font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  value={form.email}
                  readOnly
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-300 focus:outline-none"
                  aria-label="Email"
                />
              </div>

              {/* Phone */}
              <div>
<label htmlFor="phone" className="block text-sm text-slate-300 font-medium">
                  Phone Number<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Phone number"
                  placeholder="10 digit number"
                />
              </div>

              {/* Branch */}
              <div>
                <label htmlFor="branch" className="block text-sm text-slate-300 font-medium">
                  Branch
                </label>
                <input
                  id="branch"
                  name="branch"
                  value={form.branch}
                  onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Branch"
                  placeholder="Computer Engineering"
                />
              </div>

              {/* CGPA */}
              <div>
                <label htmlFor="cgpa" className="block text-sm text-slate-300 font-medium">
                  CGPA<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="cgpa"
                  name="cgpa"
                  inputMode="decimal"
                  value={form.cgpa}
                  onChange={(e) => setForm((p) => ({ ...p, cgpa: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="CGPA"
                  placeholder="0 - 10"
                />
              </div>

              {/* Graduation Year */}
              <div>
                <label htmlFor="graduationYear" className="block text-sm text-slate-300 font-medium">
                  Graduation Year<span aria-hidden="true" className="text-red-300"> *</span>
                </label>
                <input
                  id="graduationYear"
                  name="graduationYear"
                  inputMode="numeric"
                  value={form.graduationYear}
                  onChange={(e) => setForm((p) => ({ ...p, graduationYear: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Graduation year"
                  placeholder={`${currentYear} - ${currentYear + 10}`}
                />
              </div>

              {/* Skills */}
              <div className="md:col-span-2">
                <label htmlFor="skills" className="block text-sm text-slate-300 font-medium">
                  Skills
                </label>
                <input
                  id="skills"
                  name="skills"
                  value={form.skills}
                  onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Skills"
                  placeholder="React, Spring Boot, MySQL"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label htmlFor="linkedInUrl" className="block text-sm text-slate-300 font-medium">
                  LinkedIn URL
                </label>
                <input
                  id="linkedInUrl"
                  name="linkedInUrl"
                  value={form.linkedInUrl}
                  onChange={(e) => setForm((p) => ({ ...p, linkedInUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="LinkedIn URL"
                  placeholder="linkedin.com/in/..."
                />
              </div>

              {/* GitHub */}
              <div>
                <label htmlFor="githubUrl" className="block text-sm text-slate-300 font-medium">
                  GitHub URL
                </label>
                <input
                  id="githubUrl"
                  name="githubUrl"
                  value={form.githubUrl}
                  onChange={(e) => setForm((p) => ({ ...p, githubUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="GitHub URL"
                  placeholder="github.com/..."
                />
              </div>

              {/* Portfolio */}
              <div className="md:col-span-2">
                <label htmlFor="portfolioUrl" className="block text-sm text-slate-300 font-medium">
                  Portfolio URL
                </label>
                <input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Portfolio URL"
                  placeholder="https://..."
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm text-slate-300 font-medium">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="mt-1 w-full min-h-[92px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Address"
                />
              </div>

              {/* About Me */}
              <div className="md:col-span-2">
                <label htmlFor="aboutMe" className="block text-sm text-slate-300 font-medium">
                  About Me
                </label>
                <textarea
                  id="aboutMe"
                  name="aboutMe"
                  value={form.aboutMe}
                  onChange={(e) => setForm((p) => ({ ...p, aboutMe: e.target.value }))}
                  className="mt-1 w-full min-h-[110px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="About me"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
                disabled={saving}
                aria-disabled={saving}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={!canSave}
                aria-busy={saving}
                aria-disabled={!canSave}
                className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            {!canSave && validationMessage ? (
              <p className="mt-3 text-sm text-red-200" role="status" aria-live="polite">
                {validationMessage}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StudentProfile);

