import api from "../api/api";

/**
 * Job Service
 * Central place for all job-related API calls.
 *
 * The backend GET /api/students/jobs expects:
 *   pageNumber, pageSize, sortBy, sortDirection, title, location,
 *   salaryMin, salaryMax, skills, companyId, employmentType, workMode
 *
 * This service transparently maps the frontend's ergonomic names
 * (page, size, direction, requiredSkills) to the backend contract.
 */

const mapJobParams = (params = {}) => {
  const mapped = {};

  // Pagination
  if (params.page !== undefined) mapped.pageNumber = params.page;
  if (params.size !== undefined) mapped.pageSize = params.size;

  // Sorting
  if (params.sortBy !== undefined) mapped.sortBy = params.sortBy;
  if (params.direction !== undefined) mapped.sortDirection = params.direction;

  // Search
  if (params.title !== undefined) mapped.title = params.title;
  if (params.location !== undefined) mapped.location = params.location;

  // Filters
  if (params.employmentType !== undefined) mapped.employmentType = params.employmentType;
  if (params.workMode !== undefined) mapped.workMode = params.workMode;
  if (params.companyId !== undefined) mapped.companyId = params.companyId;

  // Backend expects `skills` (comma-separated); frontend uses `requiredSkills`.
  // `experience` is NOT a supported backend filter, so it is intentionally dropped.
  if (params.requiredSkills !== undefined && params.requiredSkills !== '') {
    mapped.skills = params.requiredSkills;
  }

  // Salary
  if (params.salaryMin !== undefined) mapped.salaryMin = params.salaryMin;
  if (params.salaryMax !== undefined) mapped.salaryMax = params.salaryMax;

  return mapped;
};

/**
 * Get paginated + filtered jobs.
 *
 * GET /api/students/jobs
 */
export const getJobs = async (params = {}) => {
  const res = await api.get("/api/students/jobs", {
    params: mapJobParams(params),
  });
  return res.data;
};

/**
 * Get job details by ID.
 *
 * GET /api/students/jobs/{id}
 */
export const getJobById = async (jobId) => {
  const res = await api.get(`/api/students/jobs/${jobId}`);
  return res.data;
};

/**
 * Search alias for getJobs.
 */
export const searchJobs = async (filters = {}) => {
  return getJobs(filters);
};

/**
 * Refresh jobs: fetch the default first page.
 */
export const refreshJobs = async () => {
  return getJobs({
    page: 0,
    size: 10,
    sortBy: "createdAt",
    direction: "desc",
  });
};

const jobService = {
  getJobs,
  getJobById,
  searchJobs,
  refreshJobs,
};

export default jobService;
