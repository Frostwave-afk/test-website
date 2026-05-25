const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const pool    = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All user routes require admin authentication
router.use(authMiddleware, adminMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users — List all students with form status
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const searchParam = `%${search}%`;
    const [rows] = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.email,
         u.created_at,
         CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS form_submitted,
         f.id AS form_id, f.gender, f.phone, f.submitted_at AS form_date
       FROM users u
       LEFT JOIN form_data f ON u.id = f.user_id
       WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [searchParam, searchParam, searchParam, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u
       WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?`,
      [searchParam, searchParam, searchParam]
    );

    res.json({ users: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/stats/summary — Admin dashboard stats
// ⚠️  MUST be declared BEFORE /:id to avoid Express matching "stats" as an ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)                                   AS total_students,
        (SELECT COUNT(*) FROM form_data)                               AS forms_submitted,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) AS new_today,
        (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_this_week
    `);
    res.json({ stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id/form — Admin: get a student's form data
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/form', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, u.first_name, u.last_name, u.email
       FROM form_data f
       JOIN users u ON f.user_id = u.id
       WHERE f.user_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.json({ form: null });
    const form = rows[0];
    if (typeof form.languages === 'string') {
      try { form.languages = JSON.parse(form.languages); } catch { form.languages = []; }
    }
    res.json({ form });
  } catch (err) {
    console.error('Get user form error:', err);
    res.status(500).json({ error: 'Failed to fetch form data.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/users/:id — Get single user with form data
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, f.phone, f.gender, f.languages, f.english, f.hindi, f.biology,
              f.physics, f.chemistry, f.mathematics, f.history, f.geography,
              f.computer_science, f.economics, f.submitted_at AS form_date, f.id AS form_id
       FROM users u
       LEFT JOIN form_data f ON u.id = f.user_id
       WHERE u.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    const user = rows[0];
    delete user.password_hash;
    if (typeof user.languages === 'string') {
      try { user.languages = JSON.parse(user.languages); } catch { user.languages = []; }
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/users — Admin creates a new student account
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Invalid email format.' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ error: 'Email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [firstName.trim(), lastName.trim(), email.toLowerCase().trim(), hash]
    );

    res.status(201).json({ message: 'User created successfully.', userId: result.insertId });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/users/:id — Admin updates a student
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const userId = req.params.id;

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found.' });

    if (email) {
      const [emailCheck] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]
      );
      if (emailCheck.length > 0) return res.status(409).json({ error: 'Email already in use.' });
    }

    const updates = [];
    const values = [];

    if (firstName) { updates.push('first_name = ?'); values.push(firstName.trim()); }
    if (lastName)  { updates.push('last_name = ?');  values.push(lastName.trim()); }
    if (email)     { updates.push('email = ?');      values.push(email.toLowerCase().trim()); }
    if (password)  {
      const hash = await bcrypt.hash(password, 12);
      updates.push('password_hash = ?');
      values.push(hash);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update.' });

    values.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/users/:id — Admin deletes a student (cascades to form_data)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'User not found.' });

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
