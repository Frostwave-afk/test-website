import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI, validateEmail } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login, isLoggedIn, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab]               = useState('student'); // 'student' | 'admin'
  const [studentView, setStudentView] = useState('login'); // 'login' | 'register'

  // login state
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors]     = useState({});
  const [loginLoading, setLoginLoading]   = useState(false);
  const [showLoginPwd, setShowLoginPwd]   = useState(false);

  // register state
  const [regFirstName, setRegFirstName]     = useState('');
  const [regLastName, setRegLastName]       = useState('');
  const [regEmail, setRegEmail]             = useState('');
  const [regPassword, setRegPassword]       = useState('');
  const [regConfirm, setRegConfirm]         = useState('');
  const [regErrors, setRegErrors]           = useState({});
  const [regLoading, setRegLoading]         = useState(false);
  const [showRegPwd, setShowRegPwd]         = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // admin state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminErrors, setAdminErrors]     = useState({});
  const [adminLoading, setAdminLoading]   = useState(false);

  useEffect(() => {
    if (isLoggedIn) navigate(isAdmin ? '/admin' : '/', { replace: true });
  }, [isLoggedIn, isAdmin, navigate]);

  // ── Login submit ──────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    const errs = {};
    if (!loginEmail) errs.email = 'Email is required.';
    else if (!validateEmail(loginEmail)) errs.email = 'Enter a valid email.';
    if (!loginPassword) errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setLoginErrors(errs); return; }
    setLoginErrors({});
    setLoginLoading(true);
    try {
      const data = await AuthAPI.login(loginEmail, loginPassword);
      login(data.token, { ...data.user, role: 'student' });
      showToast('Welcome back! Redirecting…', 'success');
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setLoginLoading(false); }
  }

  // ── Register submit ───────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    const errs = {};
    if (!regFirstName || regFirstName.length < 2) errs.firstName = 'First name must be at least 2 characters.';
    if (!regLastName  || regLastName.length  < 2) errs.lastName  = 'Last name must be at least 2 characters.';
    if (!regEmail) errs.email = 'Email is required.';
    else if (!validateEmail(regEmail)) errs.email = 'Enter a valid email.';
    if (!regPassword || regPassword.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!regConfirm) errs.confirm = 'Please confirm your password.';
    else if (regPassword !== regConfirm) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    setRegLoading(true);
    try {
      const data = await AuthAPI.register(regFirstName, regLastName, regEmail, regPassword);
      login(data.token, { ...data.user, role: 'student' });
      showToast('Account created! Welcome aboard!', 'success');
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setRegLoading(false); }
  }

  // ── Google Sign-In setup ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (tab === 'student' && studentView === 'login' && typeof window.google !== 'undefined') {
      const GOOGLE_CLIENT_ID = '23934249893-9e3jgojnck8mv96p89murarribvtv850.apps.googleusercontent.com';

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const data = await AuthAPI.googleAuth(response.credential);
            login(data.token, { ...data.user, role: 'student' });
            showToast('Signed in with Google! Redirecting...', 'success');
            setTimeout(() => navigate('/'), 600);
          } catch (err) {
            showToast(err.message || 'Google Sign-In failed. Please try again.', 'error');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Render button in container
      const container = document.getElementById('googleSignInContainer');
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with'
        });
      }
    }
  }, [tab, studentView]);

  // ── Admin login submit ────────────────────────────────────────────────────
  async function handleAdminLogin(e) {
    e.preventDefault();
    const errs = {};
    if (!adminUsername) errs.username = 'Username is required.';
    if (!adminPassword) errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setAdminErrors(errs); return; }
    setAdminErrors({});
    setAdminLoading(true);
    try {
      const data = await AuthAPI.adminLogin(adminUsername, adminPassword);
      login(data.token, { ...data.admin, role: 'admin' });
      showToast('Admin login successful!', 'success');
      setTimeout(() => navigate('/admin'), 600);
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setAdminLoading(false); }
  }

  // ── Google Sign-In submit ─────────────────────────────────────────────────
  React.useEffect(() => {
    if (typeof window.google !== 'undefined') {
      const GOOGLE_CLIENT_ID = '23934249893-9e3jgojnck8mv96p89murarribvtv850.apps.googleusercontent.com';

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const data = await AuthAPI.googleAuth(response.credential);
            login(data.token, { ...data.user, role: 'student' });
            showToast('Signed in with Google! Redirecting...', 'success');
            setTimeout(() => navigate('/'), 600);
          } catch (err) {
            showToast(err.message || 'Google Sign-In failed. Please try again.', 'error');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Render button in container
      const container = document.getElementById('googleSignInContainer');
      if (container && !container.hasChildNodes()) {
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with'
        });
      }
    }
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-logo-icon">🎓</div>
            <h1>College Rating System</h1>
            <p>Rate your subjects, share feedback, and help improve the quality of education at your institution.</p>
          </div>
          <div className="auth-features">
            {[
              ['fa-star', 'Rate 10 subjects from 1–10'],
              ['fa-chart-bar', 'Analytics for educators'],
              ['fa-shield-alt', 'Secure & confidential'],
              ['fa-edit', 'Edit your form anytime'],
            ].map(([icon, text]) => (
              <div className="auth-feature" key={text}>
                <div className="feat-icon"><i className={`fas ${icon}`} /></div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          {/* Tab switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${tab === 'student' ? 'active' : ''}`}
              onClick={() => { setTab('student'); setStudentView('login'); }}
              id="studentTabBtn"
            >
              <i className="fas fa-user-graduate" /> Student
            </button>
            <button
              className={`auth-tab-btn ${tab === 'admin' ? 'active' : ''}`}
              onClick={() => setTab('admin')}
              id="adminTabBtn"
            >
              <i className="fas fa-user-shield" /> Admin
            </button>
          </div>

          {/* Student panel */}
          <div className={`auth-panel ${tab === 'student' ? 'active' : ''}`} id="studentPanel">
            {studentView === 'login' ? (
              <div id="studentLoginForm">
                <h2 className="auth-panel-title">Welcome back! 👋</h2>
                <p className="auth-panel-subtitle">Sign in to your student account</p>

                <div id="googleSignInContainer" className="google-btn-container"></div>

                <div className="divider">or sign in with email</div>

                <form onSubmit={handleLogin} noValidate id="loginForm">
                  <div className="form-group">
                    <label className="form-label" htmlFor="loginEmail">Email Address <span className="required">*</span></label>
                    <input
                      type="email" id="loginEmail" className={`form-control ${loginErrors.email ? 'error' : ''}`}
                      placeholder="you@college.edu" autoComplete="email"
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    />
                    {loginErrors.email && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{loginErrors.email}</span></div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="loginPassword">Password <span className="required">*</span></label>
                    <div className="password-wrap">
                      <input
                        type={showLoginPwd ? 'text' : 'password'} id="loginPassword"
                        className={`form-control ${loginErrors.password ? 'error' : ''}`}
                        placeholder="Enter your password" autoComplete="current-password"
                        value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowLoginPwd(v => !v)}>
                        <i className={`fas ${showLoginPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                    {loginErrors.password && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{loginErrors.password}</span></div>}
                    <div style={{ textAlign: 'right', marginTop: 6 }}>
                      <a href="#" onClick={e => { e.preventDefault(); showToast('Password reset — please contact your administrator.', 'info', 4000); }} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Forgot password?
                      </a>
                    </div>
                  </div>
                  <button type="submit" className={`btn btn-primary btn-full btn-lg ${loginLoading ? 'btn-loading' : ''}`} id="loginBtn" disabled={loginLoading}>
                    {!loginLoading && <i className="fas fa-sign-in-alt" />} Sign In
                  </button>
                </form>
                <div className="form-toggle">
                  Don't have an account? <a onClick={() => setStudentView('register')} id="goToRegister">Create account</a>
                </div>
              </div>
            ) : (
              <div id="studentRegisterForm">
                <h2 className="auth-panel-title">Create Account ✨</h2>
                <p className="auth-panel-subtitle">Join to start rating your subjects</p>
                <form onSubmit={handleRegister} noValidate id="registerForm">
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label" htmlFor="regFirstName">First Name <span className="required">*</span></label>
                      <input type="text" id="regFirstName" className={`form-control ${regErrors.firstName ? 'error' : ''}`}
                        placeholder="John" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} />
                      {regErrors.firstName && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{regErrors.firstName}</span></div>}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="regLastName">Last Name <span className="required">*</span></label>
                      <input type="text" id="regLastName" className={`form-control ${regErrors.lastName ? 'error' : ''}`}
                        placeholder="Doe" value={regLastName} onChange={e => setRegLastName(e.target.value)} />
                      {regErrors.lastName && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{regErrors.lastName}</span></div>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="regEmail">Email <span className="required">*</span></label>
                    <input type="email" id="regEmail" className={`form-control ${regErrors.email ? 'error' : ''}`}
                      placeholder="you@college.edu" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                    {regErrors.email && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{regErrors.email}</span></div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="regPassword">Password <span className="required">*</span></label>
                    <div className="password-wrap">
                      <input type={showRegPwd ? 'text' : 'password'} id="regPassword"
                        className={`form-control ${regErrors.password ? 'error' : ''}`}
                        placeholder="Min 6 characters" value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                      <button type="button" className="password-toggle" onClick={() => setShowRegPwd(v => !v)}>
                        <i className={`fas ${showRegPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                    {regErrors.password && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{regErrors.password}</span></div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="regConfirmPassword">Confirm Password <span className="required">*</span></label>
                    <div className="password-wrap">
                      <input type={showRegConfirm ? 'text' : 'password'} id="regConfirmPassword"
                        className={`form-control ${regErrors.confirm ? 'error' : ''}`}
                        placeholder="Re-enter password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
                      <button type="button" className="password-toggle" onClick={() => setShowRegConfirm(v => !v)}>
                        <i className={`fas ${showRegConfirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                    {regErrors.confirm && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{regErrors.confirm}</span></div>}
                  </div>
                  <button type="submit" className={`btn btn-primary btn-full btn-lg ${regLoading ? 'btn-loading' : ''}`} id="registerBtn" disabled={regLoading}>
                    {!regLoading && <i className="fas fa-user-plus" />} Create Account
                  </button>
                </form>
                <div className="form-toggle">
                  Already have an account? <a onClick={() => setStudentView('login')} id="goToLogin">Sign in</a>
                </div>
              </div>
            )}
          </div>

          {/* Admin panel */}
          <div className={`auth-panel ${tab === 'admin' ? 'active' : ''}`} id="adminPanel">
            <div className="admin-badge"><i className="fas fa-lock" /> Admin Access Only</div>
            <h2 className="auth-panel-title">Admin Portal 🛡️</h2>
            <p className="auth-panel-subtitle">Sign in with your administrator credentials</p>
            <form onSubmit={handleAdminLogin} noValidate id="adminLoginForm">
              <div className="form-group">
                <label className="form-label" htmlFor="adminUsername">Username <span className="required">*</span></label>
                <input type="text" id="adminUsername" className={`form-control ${adminErrors.username ? 'error' : ''}`}
                  placeholder="admin" autoComplete="username" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} />
                {adminErrors.username && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{adminErrors.username}</span></div>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="adminPassword">Password <span className="required">*</span></label>
                <input type="password" id="adminPassword" className={`form-control ${adminErrors.password ? 'error' : ''}`}
                  placeholder="Admin password" autoComplete="current-password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
                {adminErrors.password && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{adminErrors.password}</span></div>}
              </div>
              <button type="submit" className={`btn btn-primary btn-full btn-lg ${adminLoading ? 'btn-loading' : ''}`} id="adminLoginBtn" disabled={adminLoading}>
                {!adminLoading && <i className="fas fa-shield-alt" />} Admin Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
