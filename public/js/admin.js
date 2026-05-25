/**
 * admin.js — Admin dashboard logic
 */

let currentPage = 1;
let searchQuery = '';
let deleteTargetId = null;
let totalUsers = 0;

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAdmin()) return;
  setUserInitials();
  loadAdminProfile();
  loadOverview();
  setupPasswordChangeForm();
});

// ── Setup password change form ───────────────────────────────────────────────
function setupPasswordChangeForm() {
  const form = document.getElementById('changePasswordForm');
  if (!form) return;
  form.addEventListener('submit', handlePasswordChange);
}

async function handlePasswordChange(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();

  let valid = true;
  ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach(id => {
    const errEl = document.getElementById(`${id}Error`);
    if (errEl) errEl.classList.remove('show');
  });

  if (!currentPassword) {
    showFieldError('currentPasswordError', 'Current password is required.');
    valid = false;
  }
  if (!newPassword || newPassword.length < 6) {
    showFieldError('newPasswordError', 'New password must be at least 6 characters.');
    valid = false;
  }
  if (!confirmNewPassword) {
    showFieldError('confirmNewPasswordError', 'Please confirm your new password.');
    valid = false;
  } else if (newPassword !== confirmNewPassword) {
    showFieldError('confirmNewPasswordError', 'Passwords do not match.');
    valid = false;
  }
  if (newPassword === currentPassword) {
    showFieldError('newPasswordError', 'New password must be different from current password.');
    valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('changePasswordBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    showToast('Password changed successfully!', 'success');
    document.getElementById('changePasswordForm').reset();
    ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach(id => {
      const errEl = document.getElementById(`${id}Error`);
      if (errEl) errEl.classList.remove('show');
    });
  } catch (err) {
    showToast('Failed to change password: ' + err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

function showFieldError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const span = el.querySelector('span');
  if (span) span.textContent = msg;
  el.classList.add('show');
  const inputId = fieldId.replace('Error', '');
  const input = document.getElementById(inputId);
  if (input) input.classList.add('error');
}

// ── Section switching ─────────────────────────────────────────────────────────
function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById(`section-${name}`).classList.add('active');
  const navBtn = document.getElementById(`nav-${name}`);
  if (navBtn) navBtn.classList.add('active');

  if (name === 'users') loadUsers();
  if (name === 'overview') loadOverview();
}

// ── Admin profile ─────────────────────────────────────────────────────────────
async function loadAdminProfile() {
  const user = Auth.getUser();
  if (!user) return;

  const name = user.fullName || user.username || 'Administrator';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Sidebar
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent   = name;
  document.getElementById('sidebarRole').textContent   = user.role === 'superadmin' ? 'Super Admin' : 'Admin';
  document.getElementById('userInitials').textContent  = initials;

  // Profile section
  const profileAvatar = document.getElementById('profileAvatar');
  const profileName   = document.getElementById('profileName');
  const profileRole   = document.getElementById('profileRole');
  if (profileAvatar) profileAvatar.textContent = initials;
  if (profileName)   profileName.textContent   = name;
  if (profileRole)   profileRole.textContent   = user.role === 'superadmin' ? '🛡️ Super Administrator' : '👤 Administrator';

  const grid = document.getElementById('profileGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="profile-field">
        <div class="profile-field-label">Username</div>
        <div class="profile-field-value">${user.username || '—'}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">Full Name</div>
        <div class="profile-field-value">${user.fullName || '—'}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">Email</div>
        <div class="profile-field-value">${user.email || '—'}</div>
      </div>
      <div class="profile-field">
        <div class="profile-field-label">Role</div>
        <div class="profile-field-value"><span class="badge badge-purple">${user.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span></div>
      </div>
    `;
  }
}

// ── Overview stats ────────────────────────────────────────────────────────────
async function loadOverview() {
  try {
    const { stats } = await UsersAPI.getStats();
    document.getElementById('statTotal').textContent = stats.total_students  || 0;
    document.getElementById('statForms').textContent = stats.forms_submitted || 0;
    document.getElementById('statToday').textContent = stats.new_today       || 0;
    document.getElementById('statWeek').textContent  = stats.new_this_week  || 0;
  } catch (err) {
    console.error('Stats error:', err);
  }

  // Load recent users in overview
  try {
    const { users } = await UsersAPI.list(1, '');
    renderRecentTable(users.slice(0, 6));
  } catch (err) { console.error('Recent users error:', err); }
}

function renderRecentTable(users) {
  const tbody = document.getElementById('recentTableBody');
  if (!tbody) return;
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">No students yet.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${escHtml(u.first_name)} ${escHtml(u.last_name)}</td>
      <td>${escHtml(u.email)}</td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        ${u.form_submitted
          ? '<span class="badge badge-success"><i class="fas fa-check"></i> Submitted</span>'
          : '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>'}
      </td>
      <td>
        <div style="display:flex;gap:6px;">
          ${u.form_submitted
            ? `<button class="btn btn-secondary btn-sm" onclick="openViewFormModal(${u.id}, '${escHtml(u.first_name)} ${escHtml(u.last_name)}')" title="View form">
                <i class="fas fa-eye"></i>
              </button>`
            : ''}
          <button class="btn btn-secondary btn-sm" onclick="openEditModal(${u.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${u.id}, '${escHtml(u.first_name)} ${escHtml(u.last_name)}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Users table ───────────────────────────────────────────────────────────────
async function loadUsers(page = 1) {
  currentPage = page;
  try {
    const data = await UsersAPI.list(page, searchQuery);
    totalUsers = data.total;
    renderUsersTable(data.users);
    renderPagination(data.total, data.limit);
  } catch (err) {
    showToast('Failed to load users: ' + err.message, 'error');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No students found.</td></tr>';
    return;
  }
  tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td>${((currentPage - 1) * 10) + i + 1}</td>
      <td><strong>${escHtml(u.first_name)} ${escHtml(u.last_name)}</strong></td>
      <td>${escHtml(u.email)}</td>
      <td>${u.gender ? `<span class="badge badge-info">${u.gender}</span>` : '—'}</td>
      <td>${formatDate(u.created_at)}</td>
      <td>
        ${u.form_submitted
          ? '<span class="badge badge-success"><i class="fas fa-check"></i> Submitted</span>'
          : '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>'}
      </td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${u.form_submitted
            ? `<button class="btn btn-secondary btn-sm" onclick="openViewFormModal(${u.id}, '${escHtml(u.first_name)} ${escHtml(u.last_name)}')" title="View form ratings">
                <i class="fas fa-eye"></i>
              </button>`
            : ''}
          <button class="btn btn-secondary btn-sm" onclick="openEditModal(${u.id})" title="Edit student">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${u.id}, '${escHtml(u.first_name)} ${escHtml(u.last_name)}')" title="Delete student">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search ────────────────────────────────────────────────────────────────────
let searchTimer;
function searchUsers(query) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = query;
    loadUsers(1);
  }, 400);
}

// ── Pagination ────────────────────────────────────────────────────────────────
function renderPagination(total, limit) {
  const pages = Math.ceil(total / limit);
  const container = document.getElementById('pagination');
  if (!container || pages <= 1) { if (container) container.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="loadUsers(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
    <i class="fas fa-chevron-left"></i></button>`;

  for (let p = 1; p <= pages; p++) {
    html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="loadUsers(${p})">${p}</button>`;
  }

  html += `<button class="page-btn" onclick="loadUsers(${currentPage + 1})" ${currentPage === pages ? 'disabled' : ''}>
    <i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  clearModalErrors();
}

function clearModalErrors() {
  document.querySelectorAll('[id$="Error"]').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.modal-box .form-control').forEach(el => el.classList.remove('error'));
}

function showModalError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.querySelector('span').textContent = msg;
  el.classList.add('show');
  const input = document.getElementById(fieldId.replace('Error', ''));
  if (input) input.classList.add('error');
}

// ── Add modal ─────────────────────────────────────────────────────────────────
function openAddModal() {
  document.getElementById('userModalTitle').textContent = 'Add Student';
  document.getElementById('userModalSubmitBtn').innerHTML = '<i class="fas fa-user-plus"></i> Add Student';
  document.getElementById('modalUserId').value = '';
  document.getElementById('modalFirstName').value  = '';
  document.getElementById('modalLastName').value   = '';
  document.getElementById('modalEmail').value      = '';
  document.getElementById('modalPassword').value   = '';
  document.getElementById('modalPasswordRequired').style.display = '';
  document.getElementById('modalPasswordHint').style.display = 'none';
  clearModalErrors();
  openModal('userModal');
}

// ── Edit modal ────────────────────────────────────────────────────────────────
async function openEditModal(userId) {
  try {
    const { user } = await UsersAPI.get(userId);
    document.getElementById('userModalTitle').textContent = 'Edit Student';
    document.getElementById('userModalSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Save Changes';
    document.getElementById('modalUserId').value     = user.id;
    document.getElementById('modalFirstName').value = user.first_name;
    document.getElementById('modalLastName').value  = user.last_name;
    document.getElementById('modalEmail').value     = user.email;
    document.getElementById('modalPassword').value  = '';
    document.getElementById('modalPasswordRequired').style.display = 'none';
    document.getElementById('modalPasswordHint').style.display = '';
    clearModalErrors();
    openModal('userModal');
  } catch (err) {
    showToast('Failed to load user: ' + err.message, 'error');
  }
}

// ── Modal form submit ─────────────────────────────────────────────────────────
document.getElementById('userModalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearModalErrors();

  const userId    = document.getElementById('modalUserId').value;
  const firstName = document.getElementById('modalFirstName').value.trim();
  const lastName  = document.getElementById('modalLastName').value.trim();
  const email     = document.getElementById('modalEmail').value.trim();
  const password  = document.getElementById('modalPassword').value;
  const isEdit    = !!userId;

  let valid = true;
  if (!firstName) { showModalError('modalFirstNameError', 'First name required.'); valid = false; }
  if (!lastName)  { showModalError('modalLastNameError',  'Last name required.');  valid = false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showModalError('modalEmailError', 'Valid email required.'); valid = false;
  }
  if (!isEdit && !password) {
    showModalError('modalPasswordError', 'Password required for new students.'); valid = false;
  }
  if (password && password.length < 6) {
    showModalError('modalPasswordError', 'Password must be at least 6 characters.'); valid = false;
  }
  if (!valid) return;

  const btn = document.getElementById('userModalSubmitBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const payload = { firstName, lastName, email };
    if (password) payload.password = password;

    if (isEdit) {
      await UsersAPI.update(userId, payload);
      showToast('Student updated successfully!', 'success');
    } else {
      await UsersAPI.create(payload);
      showToast('Student added successfully!', 'success');
    }

    closeModal('userModal');
    loadUsers(currentPage);
    loadOverview();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
});

// ── Delete modal ──────────────────────────────────────────────────────────────
function openDeleteModal(userId, name) {
  deleteTargetId = userId;
  document.getElementById('deleteUserName').textContent = name;
  openModal('deleteModal');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;
  try {
    await UsersAPI.delete(deleteTargetId);
    showToast('Student deleted successfully.', 'success');
    closeModal('deleteModal');
    deleteTargetId = null;
    loadUsers(currentPage);
    loadOverview();
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
}

// ── Close modals on overlay click ─────────────────────────────────────────────
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      clearModalErrors();
    }
  });
});


// ── View Form Modal ───────────────────────────────────────────────────────────
const SUBJECT_LABELS = {
  english: 'English', hindi: 'Hindi', biology: 'Biology',
  physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Mathematics',
  history: 'History', geography: 'Geography', computer_science: 'Computer Science',
  economics: 'Economics'
};

async function openViewFormModal(userId, userName) {
  document.getElementById('viewFormStudentName').textContent = userName;
  document.getElementById('viewFormContent').innerHTML =
    '<div style="text-align:center;padding:32px;color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  openModal('viewFormModal');

  try {
    const { form } = await UsersAPI.getUserForm(userId);
    if (!form) {
      document.getElementById('viewFormContent').innerHTML =
        '<div style="text-align:center;padding:32px;color:var(--text-muted);">No form submitted yet.</div>';
      return;
    }

    const langs = Array.isArray(form.languages) ? form.languages.join(', ') : (form.languages || '—');
    const subjHTML = Object.entries(SUBJECT_LABELS).map(([key, label]) => {
      const val = form[key] || 0;
      const color = val >= 8 ? 'var(--success)' : val >= 5 ? 'var(--primary-light)' : 'var(--error)';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;
                    background:rgba(255,255,255,0.02);border:1px solid var(--glass-border);
                    border-radius:var(--radius-md);margin-bottom:8px;">
          <span style="font-size:0.875rem;color:var(--text-secondary);">${label}</span>
          <span style="font-weight:700;font-size:1rem;color:${color};
                       background:rgba(255,255,255,0.05);border-radius:var(--radius-full);
                       padding:2px 14px;border:1px solid ${color}33;">${val}/10</span>
        </div>`;
    }).join('');

    document.getElementById('viewFormContent').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;">
        <div class="profile-field"><div class="profile-field-label">Phone</div><div class="profile-field-value">${escHtml(form.phone || '—')}</div></div>
        <div class="profile-field"><div class="profile-field-label">Gender</div><div class="profile-field-value">${escHtml(form.gender || '—')}</div></div>
        <div class="profile-field" style="grid-column:1/-1;"><div class="profile-field-label">Languages</div><div class="profile-field-value">${escHtml(langs)}</div></div>
        <div class="profile-field" style="grid-column:1/-1;"><div class="profile-field-label">Submitted</div><div class="profile-field-value">${formatDate(form.submitted_at)}</div></div>
      </div>
      <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:12px;font-weight:600;">Subject Ratings</div>
      ${subjHTML}
    `;
  } catch (err) {
    document.getElementById('viewFormContent').innerHTML =
      `<div style="text-align:center;padding:32px;color:var(--error);">Failed to load: ${escHtml(err.message)}</div>`;
  }
}

// ── CSV Export ────────────────────────────────────────────────────────────────
async function exportCSV() {
  const btn = document.getElementById('exportBtn');
  if (btn) { btn.classList.add('btn-loading'); btn.disabled = true; }

  try {
    const { forms } = await FormsAPI.getAll();
    if (!forms || forms.length === 0) {
      showToast('No form submissions to export.', 'info');
      return;
    }

    const headers = [
      'First Name','Last Name','Email','Phone','Gender','Languages',
      'English','Hindi','Biology','Physics','Chemistry',
      'Mathematics','History','Geography','Computer Science','Economics',
      'Submitted At'
    ];

    const rows = forms.map(f => [
      f.first_name, f.last_name, f.email, f.phone, f.gender,
      Array.isArray(f.languages) ? f.languages.join('; ') : (f.languages || ''),
      f.english, f.hindi, f.biology, f.physics, f.chemistry,
      f.mathematics, f.history, f.geography, f.computer_science, f.economics,
      f.submitted_at
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`));

    const csv = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `college_ratings_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${forms.length} submissions as CSV!`, 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  } finally {
    if (btn) { btn.classList.remove('btn-loading'); btn.disabled = false; }
  }
}

// ── Util ──────────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

