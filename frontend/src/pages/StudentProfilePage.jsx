import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, AuthAPI } from '../api/client';

export default function StudentProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Name editing state ────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameFirst, setNameFirst]     = useState(user?.firstName || user?.first_name || '');
  const [nameLast, setNameLast]       = useState(user?.lastName  || user?.last_name  || '');
  const [nameErrors, setNameErrors]   = useState({});
  const [nameLoading, setNameLoading] = useState(false);

  // ── Password change state ─────────────────────────────────────────────────
  const [pwdForm, setPwdForm]     = useState({ current: '', new: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const firstName = user?.firstName || user?.first_name || 'Student';
  const lastName  = user?.lastName  || user?.last_name  || '';
  const fullName  = `${firstName} ${lastName}`.trim();
  const initials  = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();

  function handleLogout() { logout(); navigate('/login'); }

  function switchSection(path) { setSidebarOpen(false); navigate(path); }

  // ── Save name ─────────────────────────────────────────────────────────────
  async function handleNameSave(e) {
    e.preventDefault();
    const errs = {};
    if (!nameFirst || nameFirst.trim().length < 2) errs.first = 'Must be at least 2 characters.';
    if (!nameLast  || nameLast.trim().length  < 2) errs.last  = 'Must be at least 2 characters.';
    if (Object.keys(errs).length) { setNameErrors(errs); return; }
    setNameErrors({});
    setNameLoading(true);
    try {
      const data = await AuthAPI.updateProfile(nameFirst.trim(), nameLast.trim());
      // Update auth context so Navbar/initials refresh immediately
      const updatedUser = {
        ...user,
        firstName: data.user.first_name,
        first_name: data.user.first_name,
        lastName: data.user.last_name,
        last_name: data.user.last_name,
      };
      // Re-use the existing token — just update stored user
      const token = localStorage.getItem('crs_token');
      login(token, updatedUser);
      showToast('Name updated successfully!', 'success');
      setEditingName(false);
    } catch (err) {
      showToast(err.message || 'Failed to update name.', 'error');
    } finally {
      setNameLoading(false);
    }
  }

  function handleNameCancel() {
    setNameFirst(user?.firstName || user?.first_name || '');
    setNameLast(user?.lastName  || user?.last_name  || '');
    setNameErrors({});
    setEditingName(false);
  }

  // ── Change password ───────────────────────────────────────────────────────
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
      await apiFetch('/auth/change-password-student', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.new }),
      });
      showToast('Password changed successfully!', 'success');
      setPwdForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <Navbar onHamburgerClick={() => setSidebarOpen(v => !v)} showHamburger />

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-profile">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-name">{fullName}</div>
            <div className="sidebar-role">Student</div>
          </div>
          <nav className="sidebar-nav">
            {[
              { id: 'home',    icon: 'fa-home',            label: 'Home',       path: '/' },
              { id: 'profile', icon: 'fa-user-cog',        label: 'My Profile', path: '/profile' },
              { id: 'help',    icon: 'fa-question-circle', label: 'Help',       path: '/help' },
            ].map(item => (
              <button
                key={item.id}
                className={`sidebar-nav-item ${item.id === 'profile' ? 'active' : ''}`}
                onClick={() => switchSection(item.path)}
                id={`student-nav-${item.id}`}
              >
                <span className="nav-icon"><i className={`fas ${item.icon}`} /></span>
                {item.label}
              </button>
            ))}
            <div className="sidebar-divider" />
            <button className="sidebar-nav-item danger" onClick={handleLogout} id="student-nav-logout">
              <span className="nav-icon"><i className="fas fa-sign-out-alt" /></span>
              Logout
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          <div style={{ padding: '28px 24px', animation: 'fadeUp 0.3s ease', maxWidth: 700 }}>

            <div className="page-header" style={{ paddingTop: 0, marginBottom: 24 }}>
              <h1 className="page-title">My Profile</h1>
              <p className="page-subtitle">Manage your student account information</p>
            </div>

            {/* ── Avatar + name display ── */}
            <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div className="sidebar-avatar" style={{ width: 64, height: 64, fontSize: '1.6rem', borderRadius: 16, flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700 }}>{fullName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>🎓 Student · {user?.email}</div>
                </div>
              </div>

              {/* ── Name edit form ── */}
              {!editingName ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'First Name', value: firstName },
                      { label: 'Last Name',  value: lastName },
                    ].map(f => (
                      <div key={f.label} style={{
                        padding: '12px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
                    {[
                      { label: 'Email', value: user?.email || '—' },
                      { label: 'Role',  value: 'Student' },
                    ].map(f => (
                      <div key={f.label} style={{
                        padding: '12px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, wordBreak: 'break-all' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setEditingName(true)}
                      id="editNameBtn"
                      style={{ fontSize: '0.875rem', padding: '9px 20px' }}
                    >
                      <i className="fas fa-pencil-alt" style={{ marginRight: 7 }} />
                      Edit Name
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleNameSave} noValidate id="nameEditForm">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="editFirstName">
                        First Name <span className="required">*</span>
                      </label>
                      <input
                        type="text" id="editFirstName"
                        className={`form-control ${nameErrors.first ? 'error' : ''}`}
                        value={nameFirst}
                        onChange={e => setNameFirst(e.target.value)}
                        placeholder="First name"
                        autoFocus
                      />
                      {nameErrors.first && (
                        <div className="form-error show">
                          <i className="fas fa-exclamation-circle" /> <span>{nameErrors.first}</span>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="editLastName">
                        Last Name <span className="required">*</span>
                      </label>
                      <input
                        type="text" id="editLastName"
                        className={`form-control ${nameErrors.last ? 'error' : ''}`}
                        value={nameLast}
                        onChange={e => setNameLast(e.target.value)}
                        placeholder="Last name"
                      />
                      {nameErrors.last && (
                        <div className="form-error show">
                          <i className="fas fa-exclamation-circle" /> <span>{nameErrors.last}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      type="submit"
                      className={`btn btn-primary ${nameLoading ? 'btn-loading' : ''}`}
                      disabled={nameLoading}
                      id="saveNameBtn"
                      style={{ fontSize: '0.875rem', padding: '9px 20px' }}
                    >
                      {!nameLoading && <i className="fas fa-check" style={{ marginRight: 7 }} />}
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleNameCancel}
                      style={{ fontSize: '0.875rem', padding: '9px 20px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Password section ── */}
            <div className="card" style={{ padding: '24px' }}>
              {user?.hasPassword ? (
                <>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 18 }}>
                    <i className="fas fa-key" style={{ marginRight: 8, color: 'var(--primary-light)' }} />
                    Change Password
                  </h3>
                  <form onSubmit={handlePwdChange} noValidate id="changePasswordForm">
                    {[
                      { id: 'current', label: 'Current Password', ph: 'Current password',   err: pwdErrors.current },
                      { id: 'new',     label: 'New Password',     ph: 'Min 6 characters',   err: pwdErrors.new },
                      { id: 'confirm', label: 'Confirm New',      ph: 'Re-enter new password', err: pwdErrors.confirm },
                    ].map(f => (
                      <div key={f.id} className="form-group">
                        <label className="form-label" htmlFor={`pwd-${f.id}`}>{f.label} <span className="required">*</span></label>
                        <input
                          type="password" id={`pwd-${f.id}`}
                          className={`form-control ${f.err ? 'error' : ''}`}
                          placeholder={f.ph}
                          value={pwdForm[f.id]}
                          onChange={e => setPwdForm(p => ({ ...p, [f.id]: e.target.value }))}
                        />
                        {f.err && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{f.err}</span></div>}
                      </div>
                    ))}
                    <button
                      type="submit"
                      className={`btn btn-primary ${pwdLoading ? 'btn-loading' : ''}`}
                      id="changePasswordBtn"
                      disabled={pwdLoading}
                      style={{ fontSize: '0.875rem', padding: '9px 22px' }}
                    >
                      {!pwdLoading && <i className="fas fa-key" style={{ marginRight: 7 }} />}
                      Update Password
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)' }}>
                  <i className="fas fa-lock" style={{ fontSize: '1.8rem', marginBottom: 10, display: 'block', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.875rem' }}>You're using Google Sign-In — no password needed.</p>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
