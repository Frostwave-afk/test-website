/**
 * api.js — Centralized API client
 * All fetch calls go through here.
 */

const API_BASE = 'https://test-website-production-1b48.up.railway.app/api';

// ── Token management ────────────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('crs_token'),
  setToken: (t) => localStorage.setItem('crs_token', t),
  removeToken: () => localStorage.removeItem('crs_token'),

  getUser: () => {
    try { return JSON.parse(localStorage.getItem('crs_user') || 'null'); }
    catch { return null; }
  },
  setUser: (u) => localStorage.setItem('crs_user', JSON.stringify(u)),
  removeUser: () => localStorage.removeItem('crs_user'),

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

// ── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired or invalid — redirect to login
    Auth.clear();
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/login.html';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
  }

  return data;
}

// ── Auth API ─────────────────────────────────────────────────────────────────
const AuthAPI = {
  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (firstName, lastName, email, password) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ firstName, lastName, email, password }) }),

  adminLogin: (username, password) =>
    apiFetch('/auth/admin-login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  googleAuth: (token) =>
    apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ token }) }),

  getMe: () => apiFetch('/auth/me'),
};

// ── Forms API ─────────────────────────────────────────────────────────────────
const FormsAPI = {
  getMyForm: () => apiFetch('/forms/my'),

  submit: (data) =>
    apiFetch('/forms', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    apiFetch(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Admin only: get all form submissions for CSV export
  getAll: () => apiFetch('/forms/all'),
};

// ── Users API (Admin) ─────────────────────────────────────────────────────────
const UsersAPI = {
  list: (page = 1, search = '') =>
    apiFetch(`/users?page=${page}&limit=10&search=${encodeURIComponent(search)}`),

  get: (id) => apiFetch(`/users/${id}`),

  getUserForm: (id) => apiFetch(`/users/${id}/form`),

  create: (data) =>
    apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),

  update: (id, data) =>
    apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id) =>
    apiFetch(`/users/${id}`, { method: 'DELETE' }),

  getStats: () => apiFetch('/users/stats/summary'),
};

// ── Analytics API (Admin) ─────────────────────────────────────────────────────
const AnalyticsAPI = {
  getSummary: () => apiFetch('/analytics/summary'),
};

// ── Toast notifications ───────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle', warning: 'exclamation-triangle' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${icons[type] || 'info-circle'}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Auth guard helpers ────────────────────────────────────────────────────────
function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ── Common UI helpers ─────────────────────────────────────────────────────────
function logout() {
  Auth.clear();
  window.location.href = '/login.html';
}

function toggleAvatarMenu() {
  const menu = document.getElementById('avatarMenu');
  if (menu) menu.classList.toggle('open');
}

// Close menu on outside click
document.addEventListener('click', (e) => {
  const avatar = document.getElementById('userAvatar');
  if (avatar && !avatar.contains(e.target)) {
    const menu = document.getElementById('avatarMenu');
    if (menu) menu.classList.remove('open');
  }
});

function setUserInitials() {
  const initEl = document.getElementById('userInitials');
  if (!initEl) return;
  const user = Auth.getUser();
  if (!user) return;

  if (user.role === 'admin') {
    initEl.textContent = (user.username || 'A').charAt(0).toUpperCase();
  } else {
    const first = (user.firstName || user.first_name || '?').charAt(0);
    const last  = (user.lastName  || user.last_name  || '').charAt(0);
    initEl.textContent = (first + last).toUpperCase();
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonth(yyyymm) {
  if (!yyyymm) return '';
  const [y, m] = yyyymm.split('-');
  return new Date(y, m - 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}
