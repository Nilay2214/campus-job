import api from "../api/api";

/**
 * Company Service
 * Central place for all company-related API calls.
 */

/**
 * List all companies (for dropdowns / job browsing).
 * GET /api/companies
 *
 * @returns {Promise<Array>} Array of CompanyResponse
 */
export const getAllCompanies = async () => {
  const res = await api.get("/api/companies");
  return res.data;
};

/**
 * List companies owned by the authenticated recruiter.
 * GET /api/recruiters/companies
 *
 * @returns {Promise<Array>} Array of CompanyResponse
 */
export const getMyCompanies = async () => {
  const res = await api.get("/api/recruiters/companies");
  return res.data;
};

/**
 * Create a company owned by the authenticated recruiter.
 * POST /api/recruiters/companies
 *
 * @param {Object} companyData
 * @returns {Promise<Object>} CompanyResponse
 */
export const createCompany = async (companyData) => {
  const res = await api.post("/api/recruiters/companies", companyData);
  return res.data;
};

/**
 * Get a company owned by the recruiter.
 * GET /api/recruiters/companies/{id}
 *
 * @param {number|string} companyId
 * @returns {Promise<Object>} CompanyResponse
 */
export const getCompany = async (companyId) => {
  const res = await api.get(`/api/recruiters/companies/${companyId}`);
  return res.data;
};

/**
 * Update a company owned by the recruiter.
 * PUT /api/recruiters/companies/{id}
 *
 * @param {number|string} companyId
 * @param {Object} companyData
 * @returns {Promise<Object>} CompanyResponse
 */
export const updateCompany = async (companyId, companyData) => {
  const res = await api.put(`/api/recruiters/companies/${companyId}`, companyData);
  return res.data;
};

/**
 * Delete a company owned by the recruiter.
 * DELETE /api/recruiters/companies/{id}
 *
 * @param {number|string} companyId
 * @returns {Promise<void>}
 */
export const deleteCompany = async (companyId) => {
  const res = await api.delete(`/api/recruiters/companies/${companyId}`);
  return res.data;
};

const companyService = {
  getAllCompanies,
  getMyCompanies,
  createCompany,
  getCompany,
  updateCompany,
  deleteCompany,
};

export default companyService;
