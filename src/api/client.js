const DEFAULT_API_PREFIX = '/api';

const trimTrailingSlashes = (value = '') => value.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const rawBase = trimTrailingSlashes(process.env.REACT_APP_API_BASE_URL || '');

  if (!rawBase) {
    return DEFAULT_API_PREFIX;
  }

  const extractPathSegments = (value) => {
    try {
      const { pathname } = new URL(value);
      return pathname.split('/').filter(Boolean);
    } catch (_error) {
      return value.split('/').filter(Boolean);
    }
  };

  const pathSegments = extractPathSegments(rawBase).map((segment) => segment.toLowerCase());

  if (pathSegments.includes('api')) {
    return rawBase;
  }

  return `${rawBase}${DEFAULT_API_PREFIX}`;
};

const API_BASE_URL = resolveApiBaseUrl();

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('authToken');
};

const request = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (!headers.Authorization) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.details || payload?.error || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
};

export default request;
