import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import jobService from '../../services/jobService';
import companyService from '../../services/companyService';
import { useAuth } from '../../context/AuthContext';

import SearchBar from '../../components/jobs/SearchBar';
import FilterSidebar from '../../components/jobs/FilterSidebar';
import JobCard from '../../components/jobs/JobCard';
import Pagination from '../../components/jobs/Pagination';
import LoadingSkeleton from '../../components/jobs/LoadingSkeleton';
import ErrorState from '../../components/jobs/ErrorState';
import EmptyState from '../../components/jobs/EmptyState';

const DEFAULT_FILTERS = {
  employmentType: '',
  workMode: '',
  experience: '',
  salaryMin: '',
  salaryMax: '',
  requiredSkills: '',
  companyId: '',
};

const JobList = () => {
  const navigate = useNavigate();
  const { role: currentRole } = useAuth();

  // ---- Pagination / Sorting ----
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [direction, setDirection] = useState('desc');

  // ---- Search ----
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');

  // ---- Filters ----
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // ---- State ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobsPage, setJobsPage] = useState(null);

  // Role-aware: only STUDENT users may apply to jobs.
  const isStudent = currentRole === 'STUDENT';

  // Companies for the filter dropdown, loaded from the authenticated listing.
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await companyService.getAllCompanies();
        if (!cancelled) setCompanies(Array.isArray(list) ? list : []);
      } catch {
        // Non-fatal: company filter dropdown simply stays empty.
        if (!cancelled) setCompanies([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const jobs = jobsPage?.content ?? [];
  const totalPages = jobsPage?.totalPages ?? 0;
  const totalElements = jobsPage?.totalElements ?? 0;

  const resetSearch = () => {
    setTitle('');
    setLocation('');
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const clearAll = () => {
    resetSearch();
    resetFilters();
    setPage(0);
  };

  const normalizeNumberIfPresent = (v) => {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n)) return undefined;
    return n;
  };

  const queryParams = useMemo(() => {
    const params = {
      page,
      size,
      sortBy,
      direction,
    };

    if (title?.trim()) params.title = title.trim();
    if (location?.trim()) params.location = location.trim();

    // Sidebar filters
    if (filters.employmentType) params.employmentType = filters.employmentType;
    if (filters.workMode) params.workMode = filters.workMode;
    if (filters.experience) params.experience = filters.experience;

    const salaryMin = normalizeNumberIfPresent(filters.salaryMin);
    const salaryMax = normalizeNumberIfPresent(filters.salaryMax);
    if (salaryMin !== undefined) params.salaryMin = salaryMin;
    if (salaryMax !== undefined) params.salaryMax = salaryMax;

    if (filters.requiredSkills?.trim()) params.requiredSkills = filters.requiredSkills.trim();
    if (filters.companyId) params.companyId = filters.companyId;

    return params;
  }, [page, size, sortBy, direction, title, location, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await jobService.getJobs(queryParams);
      setJobsPage(data ?? null);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'Failed to load jobs';
      setError(msg);
      setJobsPage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

const handleViewDetails = (jobId) => {
    if (!jobId) return;
    navigate(`/jobs/${jobId}`);
  };

  // The Apply action routes the student to the full job details page where the
  // real apply flow lives (avoids a dead no-op button on the list).
  const handleApply = (jobId) => {
    if (!jobId) return;
    navigate(`/jobs/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Jobs</h1>
            <p className="text-slate-300 mt-1">Browse active opportunities and apply.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPage(0);
                fetchJobs();
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-50 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
          <div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
              <SearchBar
                title={title}
                location={location}
                loading={loading}
                onTitleChange={(v) => {
                  setPage(0);
                  setTitle(v ?? '');
                }}
                onLocationChange={(v) => {
                  setPage(0);
                  setLocation(v ?? '');
                }}
                onSearch={() => {
                  setPage(0);
                }}
                onReset={() => {
                  resetSearch();
                  setPage(0);
                }}
              />

              {/* Sorting (UI lives here; no new components) */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm text-slate-300">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setPage(0);
                      setSortBy(e?.target?.value ?? 'createdAt');
                    }}
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Sort by"
                    disabled={loading}
                  >
                    <option value="createdAt">Created At</option>
                    <option value="deadline">Deadline</option>
                    <option value="salaryMin">Min Salary</option>
                    <option value="salaryMax">Max Salary</option>
                    <option value="title">Title</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-slate-300">Direction</span>
                  <select
                    value={direction}
                    onChange={(e) => {
                      setPage(0);
                      setDirection(e?.target?.value ?? 'desc');
                    }}
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Sort direction"
                    disabled={loading}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </label>
              </div>
            </div>

            {error ? (
              <div className="mt-6">
                <ErrorState
                  title="Error loading jobs"
                  message={error}
                  loading={loading}
                  onRetry={() => {
                    setError('');
                    fetchJobs();
                  }}
                />
              </div>
            ) : null}

            {!error && loading ? (
              <div className="mt-6">
                <LoadingSkeleton count={Math.min(size, 12)} />
              </div>
            ) : null}

            {!error && !loading && jobs.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No jobs found"
                  message="Try changing your search or filter criteria."
                  actionLabel="Clear Filters"
                  onAction={clearAll}
                />
              </div>
            ) : null}

            {!error && !loading && jobs.length > 0 ? (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="text-sm text-slate-300">
                    {totalElements > 0 ? (
                      <span>
                        Showing <span className="text-slate-50">{jobs.length}</span> of{' '}
                        <span className="text-slate-50">{totalElements}</span> jobs
                      </span>
                    ) : (
                      <span>No jobs found</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {jobs.map((job) => (
<JobCard
                      key={job?.id}
                      job={job}
                      loading={loading}
                      isStudent={isStudent}
onViewDetails={handleViewDetails}
                      onApply={handleApply}
                    />
                  ))}
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
              </div>
            ) : null}
          </div>

          <FilterSidebar
            filters={filters}
            companies={companies}
            loading={loading}
            onFilterChange={(key, value) => {
              setPage(0);
              setFilters((prev) => ({
                ...prev,
                [key]: value,
              }));
            }}
            onApplyFilters={() => {
              setPage(0);
            }}
            onResetFilters={() => {
              resetFilters();
              setPage(0);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(JobList);

