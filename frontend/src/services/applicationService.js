import api from "../api/api";

/**
 * Application Service
 * Central place for all application-related API calls.
 */

/**
 * Apply to a job.
 * POST /api/applications/{jobId}
 *
 * @param {number|string} jobId
 * @returns {Promise<Object>}
 */
export const applyToJob = async (jobId) => {
  const res = await api.post(`/api/applications/${jobId}`);
  return res.data;
};

/**
 * Get applications of the authenticated student.
 * GET /api/applications
 *
 * @returns {Promise<Object>}
 */
export const getMyApplications = async () => {
  const res = await api.get("/api/applications");
  return res.data;
};

/**
 * Withdraw an application.
 *
 * DELETE /api/applications/{applicationId}
 *
 * @param {number|string} applicationId
 * @returns {Promise<Object>}
 */
export const withdrawApplication = async (applicationId) => {
  if (!applicationId) {
    return Promise.reject(new Error('applicationId is required'));
  }
  const res = await api.delete(`/api/applications/${applicationId}`);
  return res.data;
};

const applicationService = {
  applyToJob,
  getMyApplications,
  withdrawApplication,
};

export default applicationService;

