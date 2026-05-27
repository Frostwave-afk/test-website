// ── API Base ──────────────────────────────────────────────────────────────────
export const API_BASE = 'https://test-website-production-1b48.up.railway.app/api';

// ── Token / User management ───────────────────────────────────────────────────
export const Auth = {
  getToken:   () => localStorage.getItem('crs_token'),
  setToken:   (t) => localStorage.setItem('crs_token', t),
  removeToken:() => localStorage.removeItem('crs_token'),

  getUser: () => {
    try { return JSON.parse(localStorage.getItem('crs_user') || 'null'); }
    catch { return null; }
  },
  setUser:   (u) => localStorage.setItem('crs_user', JSON.stringify(u)),
  removeUser:() => localStorage.removeItem('crs_user'),

  isLoggedIn: () => !!localStorage.getItem('crs_token'),
  isAdmin: () => {
    try {
      const u = JSON.parse(localStorage.getItem('crs_user') || '{}');
      return u.role === 'admin';
    } catch { return false; }
  },
  clear: () => {
    localStorage.removeItem('crs_token');
    localStorage.removeItem('crs_user');
  }
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
export async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
  }

  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register') {
    Auth.clear();
    window.location.href = '/login';
  }

  return data;
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const AuthAPI = {
  login:      (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register:   (firstName, lastName, email, password) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, password }) }),
  adminLogin: (username, password) =>
    apiFetch('/auth/admin-login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  googleAuth: (token) =>
    apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ token }) }),
  getMe:      () => apiFetch('/auth/me'),
};

// ── Forms API ─────────────────────────────────────────────────────────────────
export const FormsAPI = {
  getMyForm: () => apiFetch('/forms/my'),
  submit:    (data) => apiFetch('/forms', { method: 'POST', body: JSON.stringify(data) }),
  update:    (id, data) => apiFetch(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAll:    () => apiFetch('/forms/all'),
};

// ── Users API (Admin) ─────────────────────────────────────────────────────────
export const UsersAPI = {
  list:        (page = 1, search = '') =>
    apiFetch(`/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`),
  get:         (id)       => apiFetch(`/users/${id}`),
  getUserForm: (id)       => apiFetch(`/users/${id}/form`),
  create:      (data)     => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),
  update:      (id, data) => apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:      (id)       => apiFetch(`/users/${id}`, { method: 'DELETE' }),
  getStats:    ()         => apiFetch('/users/stats/summary'),
};

// ── Analytics API (Admin) ─────────────────────────────────────────────────────
export const AnalyticsAPI = {
  getSummary: () => apiFetch('/analytics/summary'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMonth(yyyymm) {
  if (!yyyymm) return '';
  const [y, m] = yyyymm.split('-');
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
