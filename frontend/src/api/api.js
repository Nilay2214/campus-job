import axios from 'axios';

// Centralized Axios instance for the whole app.
// - Uses env var for base URL
// - Attaches JWT automatically
// - Normalizes error handling

// VITE_API_BASE_URL is set in frontend/.env (e.g. http://localhost:8080).
// Fall back to localhost:8080 so the app still works if the env file is not present.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

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

    // Some apps also store additional user info; remove if present.
    localStorage.removeItem('user');
  } catch {
    // ignore
  }
};

// Request interceptor: attach Authorization header when token exists.
api.interceptors.request.use(
  (config) => {
    const token = safeGetToken();

    if (token) {
      // eslint-disable-next-line no-param-reassign
      config.headers = config.headers ?? {};
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize common statuses.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';

    if (status === 401) {
      // For general API calls, expired/invalid tokens trigger logout and redirect.
      // For auth endpoints (/api/auth/login, etc.), let the page handle the 401 directly without reloading.
      if (!requestUrl.includes('/api/auth/')) {
        safeClearAuth();
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:unauthorized'));
          }
        } catch {
          // ignore redirect issues
        }
      }
    } else if (status === 403) {
      // 403 forbidden should not clear auth; message is surfaced below.
    }

    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      'Request failed';

    // Convert to standardized error object so UI code can handle consistently.
    const normalizedError = {
      success: false,
      message,
      status: status ?? 500,
      details: error?.response?.data ?? undefined,
      response: error?.response,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;

