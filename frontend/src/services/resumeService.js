import api from '../api/api';

// Build an authorized, token-protected resume download URL.
// Resumes are served ONLY via the authenticated /api/resumes/student/{studentId}
// endpoint (the raw /uploads/** path is denyAll() in the backend SecurityConfig
// to keep candidate PII private). The JWT is attached by the axios request
// interceptor so the browser <a> must go through an XMLHttpRequest/axios fetch
// rather than a plain href (which would not carry the Authorization header).
const toBlobUrl = async (studentId, token) => {
  try {
    const res = await api.get(`/api/resumes/student/${studentId}`, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res || res.status !== 200) return null;
    const blob = res.data;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
};

// Convenience wrapper exposed to components. Returns a blob object URL usable in
// `href`/`window.open`. Caller is responsible for revoking the URL when done.
export const getResumeBlobUrl = async (studentId) => {
  if (!studentId) return null;
  let token;
  try {
    token = localStorage.getItem('token');
  } catch {
    token = null;
  }
  return toBlobUrl(studentId, token);
};

/**
 * Delete the authenticated student's resume.
 *
 * DELETE /api/students/profile/resume
 *
 * Backend behavior (STUDENT-only, ownership-checked):
 *  - Clears the student profile resumeUrl reference.
 *  - Removes the physical file if it exists (safe if already missing).
 *  - Returns 204 No Content on success.
 *
 * @returns {Promise<void>}
 */
export const deleteResume = async () => {
  await api.delete('/api/students/profile/resume');
};

const resumeService = {
  getResumeBlobUrl,
  deleteResume,
};

export default resumeService;

