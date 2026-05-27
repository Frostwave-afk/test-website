import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI, validateEmail } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const GOOGLE_CLIENT_ID = '23934249893-9e3jgojnck8mv96p89murarribvtv850.apps.googleusercontent.com';

export default function LoginPage() {
  const { login, isLoggedIn, isAdmin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // View: 'login' | 'register'
  const [view, setView] = useState('login');

  // Unified login state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  // Register state
  const [regFirstName, setRegFirstName]     = useState('');
  const [regLastName, setRegLastName]       = useState('');
  const [regEmail, setRegEmail]             = useState('');
  const [regPassword, setRegPassword]       = useState('');
  const [regConfirm, setRegConfirm]         = useState('');
  const [regErrors, setRegErrors]           = useState({});
  const [regLoading, setRegLoading]         = useState(false);
  const [showRegPwd, setShowRegPwd]         = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  const googleContainerRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) navigate(isAdmin ? '/admin' : '/', { replace: true });
  }, [isLoggedIn, isAdmin, navigate]);

  // Google Sign-In setup
  useEffect(() => {
    if (view !== 'login') return;
    const tryInit = () => {
      if (typeof window.google === 'undefined') return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const data = await AuthAPI.googleAuth(response.credential);
            login(data.token, { ...data.user, role: 'student' });
            showToast('Signed in with Google!', 'success');
            setTimeout(() => navigate('/'), 600);
          } catch (err) {
            showToast(err.message || 'Google Sign-In failed. Please try again.', 'error');
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      const container = googleContainerRef.current;
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: container.offsetWidth || 320,
        });
      }
    };
    // Try immediately, then retry if Google script hasn't loaded yet
    tryInit();
    const timer = setTimeout(tryInit, 1500);
    return () => clearTimeout(timer);
  }, [view]);

  // ── Unified smart login ──────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = 'Email is required.';
    else if (!validateEmail(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await AuthAPI.smartLogin(email, password);
      if (data.detectedRole === 'admin') {
        login(data.token, { ...data.admin, role: 'admin' });
        showToast('Welcome back, Admin!', 'success');
        setTimeout(() => navigate('/admin'), 600);
      } else {
        login(data.token, { ...data.user, role: 'student' });
        showToast('Welcome back!', 'success');
        setTimeout(() => navigate('/'), 600);
      }
    } catch (err) {
      showToast(err.message || 'Invalid email or password.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── Register submit ──────────────────────────────────────────────────────────
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

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Left decorative panel */}
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-logo-icon">🎓</div>
            <h1>College Rating System</h1>
            <p>Rate your subjects, share feedback, and help improve the quality of education at your institution.</p>
          </div>
          <div className="auth-features">
            {[
              ['fa-star',      'Rate 10 subjects from 1–10'],
              ['fa-chart-bar', 'Analytics for educators'],
              ['fa-shield-alt','Secure & confidential'],
              ['fa-edit',      'Edit your form anytime'],
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

          {/* ── LOGIN VIEW ── */}
          {view === 'login' && (
            <div id="loginView">
              <h2 className="auth-panel-title">Welcome back! 👋</h2>
              <p className="auth-panel-subtitle">Sign in with your email — works for both students and admins</p>

              {/* Google Sign-In */}
              <div ref={googleContainerRef} id="googleSignInContainer" className="google-btn-container" />

              <div className="divider">or sign in with email</div>

              <form onSubmit={handleLogin} noValidate id="loginForm">
                <div className="form-group">
                  <label className="form-label" htmlFor="loginEmail">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email" id="loginEmail"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    placeholder="you@college.edu" autoComplete="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                  {errors.email && (
                    <div className="form-error show">
                      <i className="fas fa-exclamation-circle" /> <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="loginPassword">
                    Password <span className="required">*</span>
                  </label>
                  <div className="password-wrap">
                    <input
                      type={showPwd ? 'text' : 'password'} id="loginPassword"
                      className={`form-control ${errors.password ? 'error' : ''}`}
                      placeholder="Enter your password" autoComplete="current-password"
                      value={password} onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" className="password-toggle" onClick={() => setShowPwd(v => !v)}>
                      <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  {errors.password && (
                    <div className="form-error show">
                      <i className="fas fa-exclamation-circle" /> <span>{errors.password}</span>
                    </div>
                  )}
                  <div style={{ textAlign: 'right', marginTop: 6 }}>
                    <a
                      href="#"
                      onClick={e => { e.preventDefault(); showToast('Password reset — please contact your administrator.', 'info', 4000); }}
                      style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                <button
                  type="submit" id="loginBtn"
                  className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
                  disabled={loading}
                >
                  {!loading && <i className="fas fa-sign-in-alt" />} Sign In
                </button>
              </form>

              <div className="form-toggle">
                Don't have an account?{' '}
                <a onClick={() => setView('register')} id="goToRegister" style={{ cursor: 'pointer' }}>
                  Create account
                </a>
              </div>
            </div>
          )}

          {/* ── REGISTER VIEW ── */}
          {view === 'register' && (
            <div id="registerView">
              <h2 className="auth-panel-title">Create Account ✨</h2>
              <p className="auth-panel-subtitle">Join to start rating your subjects</p>
              <form onSubmit={handleRegister} noValidate id="registerForm">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="regFirstName">First Name <span className="required">*</span></label>
                    <input type="text" id="regFirstName"
                      className={`form-control ${regErrors.firstName ? 'error' : ''}`}
                      placeholder="John" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} />
                    {regErrors.firstName && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{regErrors.firstName}</span></div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="regLastName">Last Name <span className="required">*</span></label>
                    <input type="text" id="regLastName"
                      className={`form-control ${regErrors.lastName ? 'error' : ''}`}
                      placeholder="Doe" value={regLastName} onChange={e => setRegLastName(e.target.value)} />
                    {regErrors.lastName && <div className="form-error show"><i className="fas fa-exclamation-circle" /> <span>{regErrors.lastName}</span></div>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="regEmail">Email <span className="required">*</span></label>
                  <input type="email" id="regEmail"
                    className={`form-control ${regErrors.email ? 'error' : ''}`}
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
                <button type="submit" id="registerBtn"
                  className={`btn btn-primary btn-full btn-lg ${regLoading ? 'btn-loading' : ''}`}
                  disabled={regLoading}>
                  {!regLoading && <i className="fas fa-user-plus" />} Create Account
                </button>
              </form>
              <div className="form-toggle">
                Already have an account?{' '}
                <a onClick={() => setView('login')} id="goToLogin" style={{ cursor: 'pointer' }}>Sign in</a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
