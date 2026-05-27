/**
 * auth.js — Login page logic
 * Handles student login, registration, and admin login
 */

// Redirect if already logged in
window.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    window.location.href = user && user.role === 'admin' ? '/admin.html' : '/index.html';
  }
});

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('studentPanel').classList.toggle('active', tab === 'student');
  document.getElementById('adminPanel').classList.toggle('active', tab === 'admin');
  document.getElementById('studentTabBtn').classList.toggle('active', tab === 'student');
  document.getElementById('adminTabBtn').classList.toggle('active', tab === 'admin');
  clearAllErrors();
}

// ── Toggle login / register ───────────────────────────────────────────────────
function showRegisterForm() {
  document.getElementById('studentLoginForm').style.display  = 'none';
  document.getElementById('studentRegisterForm').style.display = 'block';
  clearAllErrors();
}
function showLoginForm() {
  document.getElementById('studentRegisterForm').style.display = 'none';
  document.getElementById('studentLoginForm').style.display = 'block';
  clearAllErrors();
}

// ── Password visibility toggle ────────────────────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ── Google Sign-In ────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '23934249893-9e3jgojnck8mv96p89murarribvtv850.apps.googleusercontent.com';

function handleGoogleSignIn() {
  if (typeof google === 'undefined') {
    showToast('Google Sign-In is loading, please try again in a moment.', 'info', 3000);
    return;
  }

  const btn = document.getElementById('googleSignInBtn');
  btn.disabled = true;
  btn.style.opacity = '0.7';

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        const data = await AuthAPI.googleAuth(response.credential);
        Auth.setToken(data.token);
        Auth.setUser({ ...data.user, role: 'student' });
        showToast('Signed in with Google! Redirecting...', 'success');
        setTimeout(() => window.location.href = '/index.html', 800);
      } catch (err) {
        showToast(err.message || 'Google Sign-In failed. Please try again.', 'error');
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true
  });

  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // One Tap was blocked — fall back to popup
      google.accounts.id.renderButton(
        document.getElementById('googleSignInBtn'),
        { theme: 'outline', size: 'large', width: '100%' }
      );
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  });
}

// ── Error helpers ─────────────────────────────────────────────────────────────
function showError(fieldId, message) {
  const errEl = document.getElementById(fieldId);
  if (!errEl) return;
  errEl.querySelector('span').textContent = message;
  errEl.classList.add('show');
  const input = document.getElementById(fieldId.replace('Error', ''));
  if (input) input.classList.add('error');
}
function clearError(fieldId) {
  const errEl = document.getElementById(fieldId);
  if (!errEl) return;
  errEl.classList.remove('show');
  const input = document.getElementById(fieldId.replace('Error', ''));
  if (input) input.classList.remove('error');
}
function clearAllErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.form-control').forEach(e => e.classList.remove('error', 'success'));
}

// ── Validation helpers ────────────────────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function markSuccess(inputId) {
  const el = document.getElementById(inputId);
  if (el) { el.classList.remove('error'); el.classList.add('success'); }
}

// ── Student Login ─────────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  let valid = true;

  if (!email) { showError('loginEmailError', 'Email is required.'); valid = false; }
  else if (!validateEmail(email)) { showError('loginEmailError', 'Enter a valid email (must include @ and .)'); valid = false; }
  else { markSuccess('loginEmail'); }

  if (!password) { showError('loginPasswordError', 'Password is required.'); valid = false; }
  else { markSuccess('loginPassword'); }

  if (!valid) return;

  const btn = document.getElementById('loginBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const data = await AuthAPI.login(email, password);
    Auth.setToken(data.token);
    Auth.setUser({ ...data.user, role: 'student' });
    showToast('Welcome back! Redirecting...', 'success');
    setTimeout(() => window.location.href = '/index.html', 800);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
});

// ── Student Registration ──────────────────────────────────────────────────────
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const firstName       = document.getElementById('regFirstName').value.trim();
  const lastName        = document.getElementById('regLastName').value.trim();
  const email           = document.getElementById('regEmail').value.trim();
  const password        = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  let valid = true;

  if (!firstName || firstName.length < 2) { showError('regFirstNameError', 'First name must be at least 2 characters.'); valid = false; }
  else { markSuccess('regFirstName'); }

  if (!lastName || lastName.length < 2) { showError('regLastNameError', 'Last name must be at least 2 characters.'); valid = false; }
  else { markSuccess('regLastName'); }

  if (!email) { showError('regEmailError', 'Email is required.'); valid = false; }
  else if (!validateEmail(email)) { showError('regEmailError', 'Enter a valid email address (must include @ and .)'); valid = false; }
  else { markSuccess('regEmail'); }

  if (!password || password.length < 6) { showError('regPasswordError', 'Password must be at least 6 characters.'); valid = false; }
  else { markSuccess('regPassword'); }

  if (!confirmPassword) { showError('regConfirmPasswordError', 'Please confirm your password.'); valid = false; }
  else if (password !== confirmPassword) { showError('regConfirmPasswordError', 'Passwords do not match.'); valid = false; }
  else { markSuccess('regConfirmPassword'); }

  if (!valid) return;

  const btn = document.getElementById('registerBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const data = await AuthAPI.register(firstName, lastName, email, password);
    Auth.setToken(data.token);
    Auth.setUser({ ...data.user, role: 'student' });
    showToast('Account created! Welcome aboard!', 'success');
    setTimeout(() => window.location.href = '/index.html', 800);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
});

// ── Admin Login ───────────────────────────────────────────────────────────────
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;
  let valid = true;

  if (!username) { showError('adminUsernameError', 'Username is required.'); valid = false; }
  if (!password) { showError('adminPasswordError', 'Password is required.'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('adminLoginBtn');
  btn.classList.add('btn-loading');
  btn.disabled = true;

  try {
    const data = await AuthAPI.adminLogin(username, password);
    Auth.setToken(data.token);
    Auth.setUser({ ...data.admin, role: 'admin' });
    showToast('Admin login successful! Redirecting...', 'success');
    setTimeout(() => window.location.href = '/admin.html', 800);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
  }
});

// ── Forgot password toast ─────────────────────────────────────────────────────
function showForgotToast() {
  showToast('Password reset — please contact your administrator.', 'info', 4000);
}

// ── Real-time validation for email field ──────────────────────────────────────
document.getElementById('loginEmail').addEventListener('blur', function () {
  if (this.value && !validateEmail(this.value)) {
    showError('loginEmailError', 'Enter a valid email (must include @ and .)');
  } else {
    clearError('loginEmailError');
  }
});
document.getElementById('regEmail').addEventListener('blur', function () {
  if (this.value && !validateEmail(this.value)) {
    showError('regEmailError', 'Enter a valid email address (must include @ and .)');
  } else {
    clearError('regEmailError');
  }
});
