import api from "../api/api";

/**
 * Recruiter Job Service
 * Central place for all recruiter job-related API calls.
 */

/**
 * Create a new job.
 * POST /api/recruiters/jobs
 *
 * @param {Object} jobData
 * @returns {Promise<Object>}
 */
export const createJob = async (jobData) => {
  const res = await api.post("/api/recruiters/jobs", jobData);
  return res.data;
};

/**
 * Get recruiter-managed jobs with pagination/sorting/filtering.
 * GET /api/recruiters/jobs
 *
 * @param {Object} params
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @param {string} [params.sortBy]
 * @param {string} [params.direction]
 * @param {string} [params.status]
 * @returns {Promise<Object>} Promise<Page<JobDTO>> (backend-defined)
 */
export const getRecruiterJobs = async (params = {}) => {
  const res = await api.get("/api/recruiters/jobs", {
    params,
  });
  return res.data;
};

/**
 * Get details of a recruiter job by ID.
 * GET /api/recruiters/jobs/{jobId}
 *
 * If the backend endpoint is not implemented, keep this TODO.
 *
 * @param {number|string} jobId
 * @returns {Promise<Object>}
 */
export const getRecruiterJob = async (jobId) => {
  const res = await api.get(`/api/recruiters/jobs/${jobId}`);
  return res.data;
};

/**
 * Update an existing recruiter job.
 * PUT /api/recruiters/jobs/{jobId}
 *
 * @param {number|string} jobId
 * @param {Object} jobData
 * @returns {Promise<Object>}
 */
export const updateRecruiterJob = async (jobId, jobData) => {
  const res = await api.put(`/api/recruiters/jobs/${jobId}`, jobData);
  return res.data;
};

/**
 * Delete a recruiter job.
 * DELETE /api/recruiters/jobs/{jobId}
 *
 * @param {number|string} jobId
 * @returns {Promise<Object>}
 */
export const deleteRecruiterJob = async (jobId) => {
  const res = await api.delete(`/api/recruiters/jobs/${jobId}`);
  return res.data;
};

const recruiterJobService = {
  createJob,
  getRecruiterJobs,
  getRecruiterJob,
  updateRecruiterJob,
  deleteRecruiterJob,
};

export default recruiterJobService;

