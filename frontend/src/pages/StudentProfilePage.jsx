import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../api/client';

export default function StudentProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile / password change
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);

  const firstName = user?.firstName || user?.first_name || 'Student';
  const lastName  = user?.lastName  || user?.last_name  || '';
  const fullName  = `${firstName} ${lastName}`.trim();
  const initials  = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase();
  const formSubmitted = !!localStorage.getItem('crs_form_id');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function switchSection(path) {
    closeSidebar();
    navigate(path);
  }

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
      await apiFetch('/auth/change-password', { 
        method: 'POST', 
        body: JSON.stringify({ currentPassword: pwdForm.current, newPassword: pwdForm.new }) 
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

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
              { id: 'home', icon: 'fa-home',            label: 'Home',       path: '/' },
              { id: 'profile', icon: 'fa-user-cog', label: 'My Profile', path: '/profile' },
              { id: 'help', icon: 'fa-question-circle', label: 'Help',       path: '/help' },
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

            <button
              className="sidebar-nav-item danger"
              onClick={handleLogout}
              id="student-nav-logout"
            >
              <span className="nav-icon"><i className="fas fa-sign-out-alt" /></span>
              Logout
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          <div style={{ padding: '32px', animation: 'fadeUp 0.3s ease' }}>
            <div className="page-header" style={{ paddingTop: 0 }}>
              <h1 className="page-title">My Profile</h1>
              <p className="page-subtitle">Your student account information</p>
            </div>
            
            <div className="card" style={{ padding: 32, maxWidth: 680 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                <div className="sidebar-avatar" style={{ width: 72, height: 72, fontSize: '1.8rem', borderRadius: 18 }}>{initials}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>{fullName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 3 }}>
                    🎓 Student
                  </div>
                </div>
              </div>
              
              <div className="grid-2" style={{ marginBottom: 28 }}>
                {[
                  { label: 'First Name', value: firstName },
                  { label: 'Last Name', value: lastName },
                  { label: 'Email', value: user?.email || '—' },
                  { label: 'Role', value: 'Student' },
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
        </main>
      </div>
    </div>
  );
}
