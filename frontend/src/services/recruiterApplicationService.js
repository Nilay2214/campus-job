import api from '../api/api';

/**
 * Recruiter Application Service
 * Central place for all recruiter application review API calls.
 */

export const getRecruiterApplications = async (params = {}) => {
  const res = await api.get('/api/recruiters/applications', { params });
  return res.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
  const res = await api.patch(`/api/recruiters/applications/${applicationId}/status`, { status });
  return res.data;
};

const recruiterApplicationService = {
  getRecruiterApplications,
  updateApplicationStatus,
};

export default recruiterApplicationService;
