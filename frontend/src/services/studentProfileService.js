import api from "../api/api";

/**
 * Student Profile Service
 * Central place for all student profile API calls.
 */

/**
 * Fetch the authenticated student's profile.
 *
 * GET /api/students/profile
 *
 * @returns {Promise<Object>} Student profile DTO (shape defined by backend)
 */
export const getStudentProfile = async () => {
  const res = await api.get("/api/students/profile");
  return res.data;
};

/**
 * Save/update the authenticated student's profile.
 *
 * POST /api/students/profile
 *
 * @param {Object} profileData
 * @returns {Promise<Object>} Updated profile DTO
 */
export const saveStudentProfile = async (profileData) => {
  const res = await api.post("/api/students/profile", profileData);
  return res.data;
};

const studentProfileService = {
  getStudentProfile,
  saveStudentProfile,
};

export default studentProfileService;

