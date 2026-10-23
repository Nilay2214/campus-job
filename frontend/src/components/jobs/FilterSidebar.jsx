import React from 'react';

/**
 * FilterSidebar
 * Presentational controlled component for collecting job filters.
 * No API calls, no side effects.
 */
const FilterSidebar = ({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  loading = false,
  companies,
}) => {
  const safeFilters = filters ?? {};

  const employmentType = safeFilters.employmentType ?? '';
  const workMode = safeFilters.workMode ?? '';
  const experience = safeFilters.experience ?? '';

  const salaryMin = safeFilters.salaryMin ?? '';
  const salaryMax = safeFilters.salaryMax ?? '';

  const requiredSkills = safeFilters.requiredSkills ?? '';
  const companyId = safeFilters.companyId ?? '';

  // UI helper for consistent input handlers
  const handleChange = (key, value) => {
    onFilterChange?.(key, value);
  };

  return (
    <aside
      className="w-full lg:w-80 xl:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-sm p-4"
      aria-label="Job filters"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <span className="text-xs text-slate-400">Refine results</span>
      </div>

      {/* Employment Type */}
      <div className="mb-3">
        <label htmlFor="employmentType" className="block text-sm text-slate-300 font-medium">
          Employment Type
        </label>
        <select
          id="employmentType"
          value={employmentType}
          onChange={(e) => handleChange('employmentType', e?.target?.value ?? '')}
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Employment type"
          disabled={loading}
        >
          <option value="">Any</option>
          <option value="FULL_TIME">Full Time</option>
          <option value="PART_TIME">Part Time</option>
          <option value="INTERNSHIP">Internship</option>
          <option value="CONTRACT">Contract</option>
        </select>
      </div>

      {/* Work Mode */}
      <div className="mb-3">
        <label htmlFor="workMode" className="block text-sm text-slate-300 font-medium">
          Work Mode
        </label>
        <select
          id="workMode"
          value={workMode}
          onChange={(e) => handleChange('workMode', e?.target?.value ?? '')}
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Work mode"
          disabled={loading}
        >
          <option value="">Any</option>
          <option value="REMOTE">Remote</option>
          <option value="HYBRID">Hybrid</option>
          <option value="ONSITE">Onsite</option>
        </select>
      </div>

      {/* Experience */}
      <div className="mb-3">
        <label htmlFor="experience" className="block text-sm text-slate-300 font-medium">
          Experience
        </label>
        <select
          id="experience"
          value={experience}
          onChange={(e) => handleChange('experience', e?.target?.value ?? '')}
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Experience"
          disabled={loading}
        >
          <option value="">Any</option>
          <option value="FRESHER">Fresher</option>
          <option value="0-1">0-1 Years</option>
          <option value="1-3">1-3 Years</option>
          <option value="3-5">3-5 Years</option>
          <option value="5+">5+ Years</option>
        </select>
      </div>

      {/* Salary Range */}
      <div className="mb-3">
        <label className="block text-sm text-slate-300 font-medium">Salary Range</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="salaryMin" className="sr-only">
              Minimum Salary
            </label>
            <input
              id="salaryMin"
              type="number"
              inputMode="numeric"
              value={salaryMin}
              onChange={(e) => handleChange('salaryMin', e?.target?.value ?? '')}
              placeholder="Min"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Minimum salary"
              disabled={loading}
              min={0}
            />
          </div>
          <div>
            <label htmlFor="salaryMax" className="sr-only">
              Maximum Salary
            </label>
            <input
              id="salaryMax"
              type="number"
              inputMode="numeric"
              value={salaryMax}
              onChange={(e) => handleChange('salaryMax', e?.target?.value ?? '')}
              placeholder="Max"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Maximum salary"
              disabled={loading}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Required Skills */}
      <div className="mb-3">
        <label htmlFor="requiredSkills" className="block text-sm text-slate-300 font-medium">
          Required Skills
        </label>
        <input
          id="requiredSkills"
          type="text"
          value={requiredSkills}
          onChange={(e) => handleChange('requiredSkills', e?.target?.value ?? '')}
          placeholder="React, Spring Boot"
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Required skills"
          disabled={loading}
        />
      </div>

      {/* Company */}
      <div className="mb-4">
        <label htmlFor="companyId" className="block text-sm text-slate-300 font-medium">
          Company
        </label>
        <select
          id="companyId"
          value={companyId}
          onChange={(e) => handleChange('companyId', e?.target?.value ?? '')}
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Company"
          disabled={loading}
        >
          <option value="">Any</option>
          {(companies ?? []).map((c) => (
            <option key={c?.id} value={c?.id ?? ''}>
              {c?.name ?? 'Company'}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onApplyFilters?.()}
          disabled={loading}
          className="flex-1 rounded-lg px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={() => onResetFilters?.()}
          disabled={loading}
          className="rounded-lg px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Reset
        </button>
      </div>
    </aside>
  );
};

export default React.memo(FilterSidebar);

