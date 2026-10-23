import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

import companyService from '../../services/companyService';

import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';
import EmptyState from '../../components/jobs/EmptyState';

const MIN_YEAR = 1900;

const isValidUrl = (value) => {
  if (!value) return true; // optional
  try {
    const u = new URL(String(value).trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const CompanyProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCompany = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await companyService.getMyCompanies();
      const list = Array.isArray(data) ? data : [];
      setCompany(list[0] ?? null);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to load company';
      setError(msg);
      toast.error(msg);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompany();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCompany]);

  const initialValues = useMemo(() => {
    return {
      name: company?.name ?? '',
      industry: company?.industry ?? '',
      website: company?.website ?? '',
      location: company?.location ?? '',
      description: company?.description ?? '',
      logo: company?.logo ?? '',
    };
  }, [company]);

  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const setField = (key, value) => {
    setError('');
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validation = useMemo(() => {
    const name = String(form?.name ?? '').trim();
    if (!name) return 'Company Name is required.';

    const website = String(form?.website ?? '').trim();
    if (website && !isValidUrl(website)) return 'Company Website must be a valid URL (http/https).';

    return '';
  }, [form]);

  const canSubmit = !loading && !saving && !validation;

  const handleReset = () => {
    setForm(initialValues);
    setError('');
    toast.info('Changes reset');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!canSubmit) {
      if (validation) toast.error(validation);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: String(form?.name ?? '').trim(),
        industry: String(form?.industry ?? '').trim(),
        website: String(form?.website ?? '').trim(),
        location: String(form?.location ?? '').trim(),
        description: String(form?.description ?? '').trim(),
        logo: String(form?.logo ?? '').trim(),
      };

      if (company?.id) {
        const updated = await companyService.updateCompany(company.id, payload);
        setCompany(updated ?? payload);
        toast.success('Company profile updated');
      } else {
        const created = await companyService.createCompany(payload);
        setCompany(created ?? { ...payload, id: null });
        toast.success('Company profile created');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save company profile';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <LoadingSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto">
          <ErrorState title="Error loading company profile" message={error} loading={loading} onRetry={loadCompany} />
        </div>
      </div>
    );
  }

  const logoInitials = useMemo(() => {
    const name = String(form?.name ?? '').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : parts[0]?.[1] ?? '';
    return `${first}${second}`.toUpperCase() || 'CO';
  }, [form?.name]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Company Profile</h1>
          <p className="text-slate-300 mt-1">View and update your company information.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center"
                aria-label="Company logo placeholder"
              >
                <span className="text-slate-300 text-sm font-semibold">{logoInitials}</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm text-slate-300">Company</div>
                <div className="text-xl font-semibold text-slate-50 truncate">{form?.name || '—'}</div>
                <div className="text-sm text-slate-300 mt-1">{form?.industry || '—'}</div>
              </div>
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-300">
              <div>
                <span className="text-slate-400">Website:</span> {form?.website || '—'}
              </div>
              <div>
                <span className="text-slate-400">Location:</span> {form?.location || '—'}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold text-slate-200">Description</div>
              <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{form?.description || '—'}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-6">
            <form onSubmit={handleSubmit} aria-label="Edit company profile">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm text-slate-300 font-medium">
                    Company Name<span aria-hidden="true" className="text-red-300"> *</span>
                  </label>
                  <input
                    id="name"
                    value={form?.name ?? ''}
                    onChange={(e) => setField('name', e.target.value)}
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Company name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-sm text-slate-300 font-medium">
                    Industry
                  </label>
                  <input
                    id="industry"
                    value={form?.industry ?? ''}
                    onChange={(e) => setField('industry', e.target.value)}
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Industry"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm text-slate-300 font-medium">
                    Company Website
                  </label>
                  <input
                    id="website"
                    value={form?.website ?? ''}
                    onChange={(e) => setField('website', e.target.value)}
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Company website"
                    placeholder="https://company.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="location" className="block text-sm text-slate-300 font-medium">
                    Headquarters / Location
                  </label>
                  <input
                    id="location"
                    value={form?.location ?? ''}
                    onChange={(e) => setField('location', e.target.value)}
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Headquarters"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm text-slate-300 font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={form?.description ?? ''}
                    onChange={(e) => setField('description', e.target.value)}
                    className="mt-1 w-full min-h-[120px] rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Company description"
                    placeholder="About your company..."
                  />
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
                  onClick={handleReset}
                  disabled={saving}
                  className="rounded-lg px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
                  aria-label="Reset"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-lg px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label="Save Changes"
                  aria-disabled={!canSubmit}
                >
                  {saving ? 'Saving...' : company?.id ? 'Update Company' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CompanyProfile);
