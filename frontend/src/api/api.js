
import axios from 'axios';

// ============================================================
// API BASE URL
// Production: Render backend
// Development: Local Spring Boot backend
// ============================================================

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? 'https://campus-job-veqq.onrender.com'
  : 'http://localhost:8080';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
// Strip trailing slashes and any inadvertent trailing /api since service endpoints already specify /api
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '').replace(/\/api$/, '');

// ============================================================
// CENTRALIZED AXIOS INSTANCE
// ============================================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ============================================================
// SAFE TOKEN HELPERS
// ============================================================

const safeGetToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const safeClearAuth = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  } catch {
    // Ignore localStorage errors
  }
};

// ============================================================
// REQUEST INTERCEPTOR
// Attach the JWT token when available (excluding public auth endpoints)
// ============================================================

api.interceptors.request.use(
  (config) => {
    const isPublicAuthEndpoint = config.url && (
      config.url.startsWith('/api/auth/') ||
      config.url.startsWith('api/auth/')
    );

    if (!isPublicAuthEndpoint) {
      const token = safeGetToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR
// Normalize errors and handle unauthorized requests
// ============================================================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';

    // Handle expired or invalid JWT tokens.
    // Let login/auth pages handle their own 401 responses.
    if (status === 401) {
      if (!requestUrl.includes('/api/auth/')) {
        safeClearAuth();

        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:unauthorized'));
          }
        } catch {
          // Ignore browser event errors
        }
      }
    }

    // Use a useful message when the server is unreachable.
    let message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Request failed';

    if (!error.response && error.code === 'ECONNABORTED') {
      message =
        'The server took too long to respond. On the free Render tier, the backend may take 30-60 seconds to spin up from sleep. Please wait a moment and try again.';
    } else if (!error.response) {
      message =
        'Network Error: Unable to reach the backend. Check the backend URL, CORS configuration, and Render service status.';
    }

    const normalizedError = {
      success: false,
      message,
      status: status ?? 0,
      code: error?.code,
      details: error?.response?.data ?? undefined,
      response: error?.response,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
