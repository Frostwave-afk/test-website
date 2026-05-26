import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ isAdmin: isAdminLayout = false, onHamburgerClick, showHamburger = false }) {
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropRef = useRef(null);

  // Get initials
  const initials = (() => {
    if (!user) return '?';
    if (user.role === 'admin') return (user.username || 'A').charAt(0).toUpperCase();
    const f = (user.firstName || user.first_name || '?').charAt(0);
    const l = (user.lastName  || user.last_name  || '').charAt(0);
    return (f + l).toUpperCase();
  })();

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* Hamburger — shown on mobile for both admin and student sidebar layouts */}
      {showHamburger && (
        <button
          className="hamburger-btn"
          onClick={onHamburgerClick}
          aria-label="Toggle menu"
          id="hamburgerBtn"
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
      )}

      <Link to={isAdmin ? '/admin' : '/'} className="navbar-brand">
        <div className="brand-mark">{isAdmin ? '🛡️' : '🎓'}</div>
        {isAdmin ? 'Admin Panel' : 'College Ratings'}
      </Link>

      <div className="navbar-end">
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button
            className="user-avatar-btn"
            onClick={() => setMenuOpen(v => !v)}
            title="Account"
            id="userAvatarBtn"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="avatar-dropdown">
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'User'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  {user?.email || (user?.role === 'admin' ? 'Administrator' : '')}
                </div>
              </div>

              {isAdmin ? (
                <>
                  <Link to="/admin" className="avatar-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-th-large" /> Dashboard
                  </Link>
                  <Link to="/analytics" className="avatar-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-chart-bar" /> Analytics
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" className="avatar-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-home" /> Home
                  </Link>
                  <Link to="/help" className="avatar-dropdown-item" onClick={() => setMenuOpen(false)}>
                    <i className="fas fa-question-circle" /> Help
                  </Link>
                </>
              )}
              <div className="avatar-dropdown-divider" />
              <button className="avatar-dropdown-item danger" onClick={handleLogout} id="logoutBtn">
                <i className="fas fa-sign-out-alt" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
