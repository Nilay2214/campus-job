import api from "../api/api";

/**
 * Auth Service
 * Central place for all public authentication API calls.
 */

/**
 * Request a password reset token for an email.
 *
 * POST /api/auth/forgot-password
 *
 * @param {string} email
 * @returns {Promise<Object>} { message }
 */
export const requestPasswordReset = async (email) => {
  const res = await api.post("/api/auth/forgot-password", { email });
  return res.data;
};

/**
 * Reset a password using a token.
 *
 * POST /api/auth/reset-password
 *
 * @param {string} token
 * @param {string} newPassword
 * @returns {Promise<Object>} { message }
 */
export const resetPassword = async (token, newPassword) => {
  const res = await api.post("/api/auth/reset-password", { token, newPassword });
  return res.data;
};

const authService = {
  requestPasswordReset,
  resetPassword,
};

export default authService;
