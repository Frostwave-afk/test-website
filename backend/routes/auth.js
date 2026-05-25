const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
require('dotenv').config();

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register — Student registration
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format.' });

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email already registered. Please log in.' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [firstName.trim(), lastName.trim(), email.toLowerCase().trim(), hash]
    );

    const token = signToken({ id: result.insertId, email, role: 'student' });
    res.status(201).json({
      token,
      user: { id: result.insertId, firstName: firstName.trim(), lastName: lastName.trim(), email }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login — Student login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = rows[0];
    if (!user.password_hash)
      return res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = signToken({ id: user.id, email: user.email, role: 'student' });
    res.json({
      token,
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/admin-login — Admin login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required.' });

    const [rows] = await pool.query('SELECT * FROM admin_data WHERE username = ?', [username.trim()]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid admin credentials.' });

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid admin credentials.' });

    const token = signToken({ id: admin.id, username: admin.username, role: 'admin', adminRole: admin.role });
    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me — Get current user info
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token.' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'admin') {
      const [rows] = await pool.query(
        'SELECT id, username, email, full_name, role FROM admin_data WHERE id = ?',
        [decoded.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Admin not found.' });
      return res.json({ user: rows[0], role: 'admin' });
    }

    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0], role: 'student' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password — Admin change password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Not authenticated.' });
    
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Only admins can change password
    if (decoded.role !== 'admin') 
      return res.status(403).json({ error: 'Only admins can use this endpoint.' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new passwords are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    if (currentPassword === newPassword)
      return res.status(400).json({ error: 'New password must be different from current password.' });

    // Get admin from database
    const [rows] = await pool.query('SELECT * FROM admin_data WHERE id = ?', [decoded.id]);
    if (rows.length === 0)
      return res.status(404).json({ error: 'Admin not found.' });

    const admin = rows[0];

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Current password is incorrect.' });

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query('UPDATE admin_data SET password_hash = ? WHERE id = ?', [newHash, decoded.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google — Google OAuth (Stub — configure later)
// ─────────────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
// TODO: GOOGLE OAUTH — See GOOGLE_AUTH_SETUP.md for setup instructions
//
// To enable Google Sign-In:
//   1. Create a Google Cloud project & get OAuth 2.0 credentials
//   2. Set GOOGLE_CLIENT_ID in backend/.env
//   3. Run: npm install google-auth-library
//   4. Uncomment the implementation block below
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/google', async (req, res) => {
  return res.status(501).json({
    error: 'Google Sign-In not yet configured.',
    message: 'See GOOGLE_AUTH_SETUP.md for step-by-step setup instructions.',
    setupFile: 'GOOGLE_AUTH_SETUP.md'
  });

  /* ── UNCOMMENT BELOW AFTER GOOGLE_CLIENT_ID IS SET ──────────────────────
  try {
    const { token } = req.body;
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub: googleId, email, given_name: firstName, family_name: lastName } = ticket.getPayload();

    let [users] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]
    );

    let user;
    if (users.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (first_name, last_name, email, google_id) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, googleId]
      );
      user = { id: result.insertId, first_name: firstName, last_name: lastName, email };
    } else {
      user = users[0];
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      }
    }

    const jwtToken = signToken({ id: user.id, email: user.email, role: 'student' });
    res.json({
      token: jwtToken,
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed.' });
  }
  ── END UNCOMMENT BLOCK ─────────────────────────────────────────────────── */
});

module.exports = router;
