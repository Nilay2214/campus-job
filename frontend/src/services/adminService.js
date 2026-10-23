import api from '../api/api';

/**
 * Admin Service
 * Central place for all admin dashboard API calls.
 */

export const getDashboardStats = async () => {
  const res = await api.get('/api/admin/dashboard');
  return res.data;
};

export const getAdminUsers = async () => {
  const res = await api.get('/api/admin/users');
  return res.data;
};

export const getAdminCompanies = async () => {
  const res = await api.get('/api/admin/companies');
  return res.data;
};

/**
 * Enable or disable a user account (ADMIN only).
 * PATCH /api/admin/users/{id}/status
 *
 * @param {number} id - user id
 * @param {boolean} enabled - new enabled state
 * @returns {Promise<Object>} updated AdminUserDTO
 */
export const updateUserStatus = async (id, enabled) => {
  const res = await api.patch(`/api/admin/users/${id}/status`, { enabled });
  return res.data;
};

export const getAdminAnalytics = async () => {
  const res = await api.get('/api/admin/analytics');
  return res.data;
};

export const getAdminReports = async () => {
  const res = await api.get('/api/admin/reports');
  return res.data;
};

export const getAdminAuditLogs = async () => {
  const res = await api.get('/api/admin/audit-logs');
  return res.data;
};

const adminService = {
  getDashboardStats,
  getAdminUsers,
  getAdminCompanies,
  getAdminAnalytics,
  getAdminReports,
  getAdminAuditLogs,
  updateUserStatus,
};

export default adminService;
