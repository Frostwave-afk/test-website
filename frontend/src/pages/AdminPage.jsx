import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UsersAPI, FormsAPI, apiFetch, formatDate } from '../api/client';

const SUBJECT_LABELS = {
  english: 'English', hindi: 'Hindi', biology: 'Biology',
  physics: 'Physics', chemistry: 'Chemistry', mathematics: 'Mathematics',
  history: 'History', geography: 'Geography', computer_science: 'Computer Science',
  economics: 'Economics'
};

export default function AdminPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [section, setSection]     = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats]         = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [users, setUsers]         = useState([]);
  const [totalUsers, setTotalUsers]   = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');

  // Modal state
  const [userModal, setUserModal]   = useState(false);
  const [modalMode, setModalMode]   = useState('add'); // 'add' | 'edit'
  const [modalData, setModalData]   = useState({ id: '', firstName: '', lastName: '', email: '', password: '' });
  const [modalErrors, setModalErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);

  const [deleteModal, setDeleteModal]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewFormModal, setViewFormModal]   = useState(false);
  const [viewFormData, setViewFormData]     = useState(null);
  const [viewFormName, setViewFormName]     = useState('');
  const [viewFormLoading, setViewFormLoading] = useState(false);

  // Profile / password change
  const [pwdForm, setPwdForm]     = useState({ current: '', new: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const searchTimer = useRef(null);

  const adminName = user?.fullName || user?.username || 'Administrator';
  const adminInitials = adminName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => { loadOverview(); }, []);

  async function loadOverview() {
    try {
      const { stats: s } = await UsersAPI.getStats();
      setStats(s || {});
    } catch {}
    try {
      const data = await UsersAPI.list(1, '');
      setRecentUsers((data.users || []).slice(0, 6));
    } catch {}
  }

  async function loadUsers(p = 1, q = search) {
    try {
      const data = await UsersAPI.list(p, q);
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      setPage(p);
    } catch (err) { showToast('Failed to load users: ' + err.message, 'error'); }
  }

  function handleSearchChange(val) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadUsers(1, val), 400);
  }

  function switchSection(name) {
    setSection(name);
    setSidebarOpen(false);
    if (name === 'users') loadUsers(1, '');
    if (name === 'overview') loadOverview();
  }

  // ── User Modal ────────────────────────────────────────────────────────────
  function openAddModal() {
    setModalMode('add');
    setModalData({ id: '', firstName: '', lastName: '', email: '', password: '' });
    setModalErrors({});
    setUserModal(true);
  }

  async function openEditModal(userId) {
    try {
      const { user: u } = await UsersAPI.get(userId);
      setModalMode('edit');
      setModalData({ id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email, password: '' });
      setModalErrors({});
      setUserModal(true);
    } catch (err) { showToast('Failed to load user: ' + err.message, 'error'); }
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!modalData.firstName) errs.firstName = 'First name required.';
    if (!modalData.lastName)  errs.lastName  = 'Last name required.';
    if (!modalData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalData.email))
      errs.email = 'Valid email required.';
    if (modalMode === 'add' && !modalData.password) errs.password = 'Password required for new students.';
    if (modalData.password && modalData.password.length < 6) errs.password = 'Min 6 characters.';
    if (Object.keys(errs).length) { setModalErrors(errs); return; }

    setModalLoading(true);
    try {
      const payload = { firstName: modalData.firstName, lastName: modalData.lastName, email: modalData.email };
      if (modalData.password) payload.password = modalData.password;
      if (modalMode === 'edit') {
        await UsersAPI.update(modalData.id, payload);
        showToast('Student updated successfully!', 'success');
      } else {
        await UsersAPI.create(payload);
        showToast('Student added successfully!', 'success');
      }
      setUserModal(false);
      loadUsers(page);
      loadOverview();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setModalLoading(false); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function openDeleteModal(userId, name) {
    setDeleteTarget({ id: userId, name });
    setDeleteModal(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await UsersAPI.delete(deleteTarget.id);
      showToast('Student deleted.', 'success');
      setDeleteModal(false);
      setDeleteTarget(null);
      loadUsers(page);
      loadOverview();
    } catch (err) { showToast('Delete failed: ' + err.message, 'error'); }
    finally { setDeleteLoading(false); }
  }

  // ── View Form ─────────────────────────────────────────────────────────────
  async function openViewForm(userId, name) {
    setViewFormName(name);
    setViewFormData(null);
    setViewFormLoading(true);
    setViewFormModal(true);
    try {
      const { form } = await UsersAPI.getUserForm(userId);
      setViewFormData(form || null);
    } catch {}
    finally { setViewFormLoading(false); }
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  async function exportCSV() {
    try {
      const { forms } = await FormsAPI.getAll();
      if (!forms?.length) { showToast('No submissions to export.', 'info'); return; }
      const headers = ['First Name','Last Name','Email','Phone','Gender','Languages',
        'English','Hindi','Biology','Physics','Chemistry','Mathematics','History','Geography','Computer Science','Economics','Submitted At'];
      const rows = forms.map(f => [
        f.first_name, f.last_name, f.email, f.phone, f.gender,
        Array.isArray(f.languages) ? f.languages.join('; ') : (f.languages || ''),
        f.english, f.hindi, f.biology, f.physics, f.chemistry,
        f.mathematics, f.history, f.geography, f.computer_science, f.economics, f.submitted_at
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`));
      const csv = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `college_ratings_${new Date().toISOString().slice(0,10)}.csv` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${forms.length} submissions!`, 'success');
    } catch (err) { showToast('Export failed: ' + err.message, 'error'); }
  }

  // ── Password change ───────────────────────────────────────────────────────
  async function handlePwdChange(e) {
    e.preventDefault();
    const errs = {};
    if (!pwdForm.current) errs.current = 'Current password is required.';
    if (!pwdForm.new || pwdForm.new.length < 6) errs.new = 'New password must be at least 6 characters.';
    if (!pwdForm.confirm) errs.confirm = 'Please confirm new password.';
    else if (pwdForm.new !== pwdForm.confirm) errs.confirm = 'Passwords do not match.';
    if (pwdForm.new === pwdForm.current) errs.new = 'New password must differ from current.';
    if (Object.keys(errs).length) { setPwdErrors(errs); return; }
    setPwdErrors({});
    setPwdLoading(true);
    try {
      await apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.new }) });
      showToast('Password changed successfully!', 'success');
      setPwdForm({ current: '', new: '', confirm: '' });
    } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    finally { setPwdLoading(false); }
  }

  const totalPages = Math.ceil(totalUsers / 10);

  return (
    <div className="page-wrapper">
      <Navbar isAdmin showHamburger onHamburgerClick={() => setSidebarOpen(v => !v)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{adminInitials}</div>
            <div className="sidebar-name">{adminName}</div>
            <div className="sidebar-role">{user?.role === 'superadmin' ? 'Super Admin' : 'Admin'}</div>
          </div>
          <nav className="sidebar-nav">
            {[
              { id: 'overview', icon: 'fa-th-large', label: 'Overview' },
              { id: 'users',    icon: 'fa-users',    label: 'Manage Students' },
              { id: 'profile',  icon: 'fa-user-cog', label: 'My Profile' },
            ].map(item => (
              <button key={item.id}
                className={`sidebar-nav-item ${section === item.id ? 'active' : ''}`}
                onClick={() => switchSection(item.id)}
                id={`nav-${item.id}`}
              >
                <span className="nav-icon"><i className={`fas ${item.icon}`} /></span>
                {item.label}
              </button>
            ))}
            <div className="sidebar-divider" />
            <Link to="/analytics" className="sidebar-nav-item">
              <span className="nav-icon"><i className="fas fa-chart-bar" /></span> Analytics
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="admin-main">

          {/* ── Overview ─────────────────────────────────────── */}
          {section === 'overview' && (
            <div style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
              <div className="page-header" style={{ paddingTop: 0 }}>
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Overview of the college rating system</p>
              </div>

              <div className="grid-4" style={{ marginBottom: 36 }}>
                {[
                  { icon: 'fa-users',          color: 'purple', label: 'Total Students',  value: stats.total_students  ?? '—' },
                  { icon: 'fa-clipboard-check',color: 'teal',   label: 'Forms Submitted', value: stats.forms_submitted ?? '—' },
                  { icon: 'fa-user-plus',       color: 'green',  label: 'Joined Today',   value: stats.new_today       ?? '—' },
                  { icon: 'fa-chart-line',      color: 'pink',   label: 'This Week',       value: stats.new_this_week  ?? '—' },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <div className={`stat-icon ${s.color}`}><i className={`fas ${s.icon}`} /></div>
                    <div className="stat-info">
                      <div className="stat-value">{s.value}</div>
                      <div className="stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-heading">Recent Students</div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Joined</th><th>Form</th><th>Actions</th></tr></thead>
                  <tbody>
                    {recentUsers.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No students yet.</td></tr>
                      : recentUsers.map((u, i) => (
                          <UserRow key={u.id} user={u} index={i + 1}
                            onEdit={() => openEditModal(u.id)}
                            onDelete={() => openDeleteModal(u.id, `${u.first_name} ${u.last_name}`)}
                            onView={() => openViewForm(u.id, `${u.first_name} ${u.last_name}`)}
                          />
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Manage Users ─────────────────────────────────── */}
          {section === 'users' && (
            <div style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
              <div className="page-header" style={{ paddingTop: 0 }}>
                <h1 className="page-title">Manage Students</h1>
                <p className="page-subtitle">Add, edit, or remove student accounts</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <div className="search-bar">
                  <i className="fas fa-search search-icon" />
                  <input className="search-input" type="text" placeholder="Search students…"
                    value={search} onChange={e => handleSearchChange(e.target.value)} id="userSearch" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={exportCSV} id="exportBtn">
                    <i className="fas fa-file-csv" /> Export CSV
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={openAddModal} id="addStudentBtn">
                    <i className="fas fa-plus" /> Add Student
                  </button>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>#</th><th>Full Name</th><th>Email</th><th>Gender</th><th>Joined</th><th>Form Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {users.length === 0
                      ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No students found.</td></tr>
                      : users.map((u, i) => (
                          <UserRow key={u.id} user={u} index={(page - 1) * 10 + i + 1} showGender
                            onEdit={() => openEditModal(u.id)}
                            onDelete={() => openDeleteModal(u.id, `${u.first_name} ${u.last_name}`)}
                            onView={() => openViewForm(u.id, `${u.first_name} ${u.last_name}`)}
                          />
                        ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="pagination" style={{ marginTop: 20, justifyContent: 'center' }}>
                  <button className="page-btn" disabled={page <= 1} onClick={() => loadUsers(page - 1)}>
                    <i className="fas fa-chevron-left" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => loadUsers(p)}>{p}</button>
                  ))}
                  <button className="page-btn" disabled={page >= totalPages} onClick={() => loadUsers(page + 1)}>
                    <i className="fas fa-chevron-right" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── My Profile ───────────────────────────────────── */}
          {section === 'profile' && (
            <div style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
              <div className="page-header" style={{ paddingTop: 0 }}>
                <h1 className="page-title">My Profile</h1>
                <p className="page-subtitle">Your administrator account information</p>
              </div>
              <div className="card" style={{ padding: 32, maxWidth: 680 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                  <div className="sidebar-avatar" style={{ width: 72, height: 72, fontSize: '1.8rem', borderRadius: 18 }}>{adminInitials}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{adminName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 3 }}>
                      {user?.role === 'superadmin' ? '🛡️ Super Administrator' : '👤 Administrator'}
                    </div>
                  </div>
                </div>
                <div className="grid-2" style={{ marginBottom: 28 }}>
                  {[
                    { label: 'Username', value: user?.username || '—' },
                    { label: 'Full Name', value: user?.fullName || '—' },
                    { label: 'Email', value: user?.email || '—' },
                    { label: 'Role', value: user?.role === 'superadmin' ? 'Super Admin' : 'Admin' },
                  ].map(f => (
                    <div key={f.label} style={{ padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{f.label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
                  <form onSubmit={handlePwdChange} noValidate id="changePasswordForm">
                    {[
                      { id: 'current', label: 'Current Password', ph: 'Current password', err: pwdErrors.current },
                      { id: 'new',     label: 'New Password',     ph: 'Min 6 characters', err: pwdErrors.new },
                      { id: 'confirm', label: 'Confirm New',      ph: 'Re-enter new password', err: pwdErrors.confirm },
                    ].map(f => (
                      <div key={f.id} className="form-group">
                        <label className="form-label" htmlFor={f.id}>{f.label} <span className="required">*</span></label>
                        <input type="password" id={f.id} className={`form-control ${f.err ? 'error' : ''}`} placeholder={f.ph}
                          value={pwdForm[f.id]} onChange={e => setPwdForm(p => ({ ...p, [f.id]: e.target.value }))} />
                        {f.err && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{f.err}</span></div>}
                      </div>
                    ))}
                    <button type="submit" className={`btn btn-primary ${pwdLoading ? 'btn-loading' : ''}`} id="changePasswordBtn" disabled={pwdLoading}>
                      {!pwdLoading && <i className="fas fa-key" />} Update Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Add/Edit User Modal ────────────────────────────── */}
      {userModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setUserModal(false)}>
          <div className="modal-box wide">
            <div className="modal-header">
              <div className="modal-title" id="userModalTitle">{modalMode === 'add' ? 'Add Student' : 'Edit Student'}</div>
              <button className="modal-close" onClick={() => setUserModal(false)}><i className="fas fa-times" /></button>
            </div>
            <form onSubmit={handleModalSubmit} noValidate id="userModalForm">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="modalFirstName">First Name <span className="required">*</span></label>
                  <input type="text" id="modalFirstName" className={`form-control ${modalErrors.firstName ? 'error' : ''}`}
                    placeholder="John" value={modalData.firstName} onChange={e => setModalData(d => ({ ...d, firstName: e.target.value }))} />
                  {modalErrors.firstName && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{modalErrors.firstName}</span></div>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="modalLastName">Last Name <span className="required">*</span></label>
                  <input type="text" id="modalLastName" className={`form-control ${modalErrors.lastName ? 'error' : ''}`}
                    placeholder="Doe" value={modalData.lastName} onChange={e => setModalData(d => ({ ...d, lastName: e.target.value }))} />
                  {modalErrors.lastName && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{modalErrors.lastName}</span></div>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="modalEmail">Email <span className="required">*</span></label>
                <input type="email" id="modalEmail" className={`form-control ${modalErrors.email ? 'error' : ''}`}
                  placeholder="john@college.edu" value={modalData.email} onChange={e => setModalData(d => ({ ...d, email: e.target.value }))} />
                {modalErrors.email && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{modalErrors.email}</span></div>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="modalPassword">
                  Password {modalMode === 'add' ? <span className="required">*</span> : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep unchanged)</span>}
                </label>
                <input type="password" id="modalPassword" className={`form-control ${modalErrors.password ? 'error' : ''}`}
                  placeholder="Min 6 characters" value={modalData.password} onChange={e => setModalData(d => ({ ...d, password: e.target.value }))} />
                {modalErrors.password && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{modalErrors.password}</span></div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setUserModal(false)}>Cancel</button>
                <button type="submit" className={`btn btn-primary ${modalLoading ? 'btn-loading' : ''}`} id="userModalSubmitBtn" disabled={modalLoading}>
                  {!modalLoading && <i className={`fas ${modalMode === 'add' ? 'fa-user-plus' : 'fa-save'}`} />}
                  {modalMode === 'add' ? 'Add Student' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ────────────────────────────────────── */}
      {deleteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeleteModal(false)}>
          <div className="modal-box" style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'hsl(355,80%,10%)', border: '2px solid hsl(355,80%,25%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', margin: '0 auto 20px'
            }}>🗑️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Delete Student?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 6 }}>This action cannot be undone. All data will be permanently deleted.</p>
            <p style={{ fontWeight: 600, marginBottom: 24 }} id="deleteUserName">{deleteTarget?.name}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteModal(false)}>Cancel</button>
              <button className={`btn btn-danger ${deleteLoading ? 'btn-loading' : ''}`} onClick={confirmDelete} id="confirmDeleteBtn" disabled={deleteLoading}>
                {!deleteLoading && <i className="fas fa-trash" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Form Modal ──────────────────────────────────── */}
      {viewFormModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewFormModal(false)}>
          <div className="modal-box wide" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div className="modal-title">
                <i className="fas fa-clipboard-list" style={{ color: 'var(--primary-light)', marginRight: 8 }} />
                Form Details — {viewFormName}
              </div>
              <button className="modal-close" onClick={() => setViewFormModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div style={{ maxHeight: '65vh', overflowY: 'auto' }} id="viewFormContent">
              {viewFormLoading && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin" /> Loading…</div>}
              {!viewFormLoading && !viewFormData && <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No form submitted yet.</div>}
              {!viewFormLoading && viewFormData && (
                <>
                  <div className="grid-2" style={{ marginBottom: 20 }}>
                    {[
                      { label: 'Phone', value: viewFormData.phone || '—' },
                      { label: 'Gender', value: viewFormData.gender || '—' },
                      { label: 'Languages', value: Array.isArray(viewFormData.languages) ? viewFormData.languages.join(', ') : (viewFormData.languages || '—') },
                      { label: 'Submitted', value: formatDate(viewFormData.submitted_at) },
                    ].map(f => (
                      <div key={f.label} style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="section-heading">Subject Ratings</div>
                  {Object.entries(SUBJECT_LABELS).map(([key, label]) => {
                    const val = parseInt(viewFormData[key]) || 0;
                    const color = val >= 8 ? 'var(--success)' : val >= 5 ? 'var(--primary-light)' : 'var(--danger)';
                    return (
                      <div key={key} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: 8,
                      }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', padding: '2px 14px', border: `1px solid ${color}33` }}>
                          {val > 0 ? `${val}/10` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewFormModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({ user: u, index, showGender, onEdit, onDelete, onView }) {
  return (
    <tr>
      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{index}</td>
      <td><strong>{u.first_name} {u.last_name}</strong></td>
      <td style={{ fontSize: '0.83rem' }}>{u.email}</td>
      {showGender && <td>{u.gender ? <span className="badge badge-info">{u.gender}</span> : '—'}</td>}
      <td style={{ fontSize: '0.82rem' }}>{formatDate(u.created_at)}</td>
      <td>
        {u.form_submitted
          ? <span className="badge badge-success"><i className="fas fa-check" /> Submitted</span>
          : <span className="badge badge-warning"><i className="fas fa-clock" /> Pending</span>}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          {u.form_submitted && (
            <button className="btn btn-secondary btn-sm" onClick={onView} title="View form">
              <i className="fas fa-eye" />
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onEdit} title="Edit">
            <i className="fas fa-edit" />
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete} title="Delete">
            <i className="fas fa-trash" />
          </button>
        </div>
      </td>
    </tr>
  );
}
