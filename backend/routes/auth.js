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
      user: { id: result.insertId, firstName: firstName.trim(), lastName: lastName.trim(), email, hasPassword: true }
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
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, hasPassword: true }
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
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    // Look up admin by email
    const [rows] = await pool.query('SELECT * FROM admin_data WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials.' });

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials.' });

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
// POST /api/auth/change-password-student — Student change their own password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/change-password-student', async (req, res) => {
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

    // Only students can use this endpoint
    if (decoded.role !== 'student') 
      return res.status(403).json({ error: 'Only students can use this endpoint.' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new passwords are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    if (currentPassword === newPassword)
      return res.status(400).json({ error: 'New password must be different from current password.' });

    // Get student from database
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0)
      return res.status(404).json({ error: 'Student not found.' });

    const student = rows[0];

    // Check if student has a password (not Google auth only)
    if (!student.password_hash)
      return res.status(400).json({ error: 'Password changes are not available for Google Sign-In accounts. Please use Google to authenticate.' });

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, student.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Current password is incorrect.' });

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, decoded.id]);

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password-student — Student change their own password
// ─────────────────────────────────────────────────────────────────────────────
router.post('/change-password-student', async (req, res) => {
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

    // Only students can use this endpoint
    if (decoded.role !== 'student') 
      return res.status(403).json({ error: 'Only students can use this endpoint.' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new passwords are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });

    if (currentPassword === newPassword)
      return res.status(400).json({ error: 'New password must be different from current password.' });

    // Get student from database
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0)
      return res.status(404).json({ error: 'Student not found.' });

    const student = rows[0];

    // Check if student has a password (not Google auth only)
    if (!student.password_hash)
      return res.status(400).json({ error: 'Password changes are not available for Google Sign-In accounts. Please use Google to authenticate.' });

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, student.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Current password is incorrect.' });

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, decoded.id]);

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
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google token is required.' });

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

    let [users] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]
    );

    let user;
    if (users.length === 0) {
      // New user — create account automatically
      const [result] = await pool.query(
        'INSERT INTO users (first_name, last_name, email, google_id) VALUES (?, ?, ?, ?)',
        [firstName || 'User', lastName || '', email, googleId]
      );
      user = { id: result.insertId, first_name: firstName || 'User', last_name: lastName || '', email, password_hash: null };
    } else {
      user = users[0];
      // Link google_id to existing email/password account if not already linked
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
      }
    }

    const jwtToken = signToken({ id: user.id, email: user.email, role: 'student' });
    res.json({
      token: jwtToken,
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, hasPassword: !!user.password_hash }
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/debug-login — Debug login (DEVELOPMENT ONLY)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/debug-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Debug endpoint not available in production.' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required.' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    
    if (rows.length === 0) {
      return res.json({ 
        success: false,
        message: 'User not found',
        email: email.toLowerCase().trim()
      });
    }

    const user = rows[0];
    console.log('\n🔍 DEBUG LOGIN INFO:');
    console.log('   Email:', user.email);
    console.log('   Password in DB:', user.password_hash ? `${user.password_hash.substring(0, 20)}...` : 'NULL/EMPTY');
    console.log('   Is bcrypt hash?', /^\$2[aby]\$/.test(user.password_hash || ''));
    console.log('   Hash length:', (user.password_hash || '').length);

    if (!user.password_hash) {
      return res.json({
        success: false,
        message: 'No password set. User must use Google Sign-In.',
        debug: { email: user.email, password_hash: null }
      });
    }

    // Test bcrypt comparison
    const match = await bcrypt.compare(password, user.password_hash);
    console.log('   bcrypt.compare result:', match);
    console.log('');

    res.json({
      success: match,
      message: match ? 'Password matches!' : 'Password does NOT match',
      debug: {
        email: user.email,
        passwordHashStartsWith: user.password_hash.substring(0, 10),
        passwordHashLength: user.password_hash.length,
        isBcryptHash: /^\$2[aby]\$/.test(user.password_hash),
        compareResult: match,
        plainTextInput: password
      }
    });
  } catch (err) {
    console.error('Debug login error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
