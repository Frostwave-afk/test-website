const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/forms/all — Admin: get all form submissions (for CSV export)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.first_name, u.last_name, u.email,
        f.phone, f.gender, f.languages,
        f.english, f.hindi, f.biology, f.physics, f.chemistry,
        f.mathematics, f.history, f.geography, f.computer_science, f.economics,
        f.submitted_at
      FROM form_data f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.submitted_at DESC
    `);
    // Parse languages JSON
    rows.forEach(r => {
      if (typeof r.languages === 'string') {
        try { r.languages = JSON.parse(r.languages); } catch { r.languages = []; }
      }
    });
    res.json({ forms: rows, total: rows.length });
  } catch (err) {
    console.error('Get all forms error:', err);
    res.status(500).json({ error: 'Failed to fetch all forms.' });
  }
});

// All remaining form routes require student authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/forms/my — Get the current student's form (if exists)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT f.*, u.first_name, u.last_name, u.email
       FROM form_data f
       JOIN users u ON f.user_id = u.id
       WHERE f.user_id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.json({ form: null });

    const form = rows[0];
    // Parse languages JSON if stored as string
    if (typeof form.languages === 'string') {
      try { form.languages = JSON.parse(form.languages); } catch { form.languages = []; }
    }
    res.json({ form });
  } catch (err) {
    console.error('Get form error:', err);
    res.status(500).json({ error: 'Failed to fetch form data.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/forms — Submit a new form
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      phone, gender, languages,
      english, hindi, biology, physics, chemistry,
      mathematics, history, geography, computer_science, economics
    } = req.body;

    // Validate required fields
    if (!phone || !gender || !languages || !Array.isArray(languages) || languages.length === 0)
      return res.status(400).json({ error: 'Phone, gender, and at least one language are required.' });

    if (!/^\d{10}$/.test(phone))
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });

    const ratings = { english, hindi, biology, physics, chemistry, mathematics, history, geography, computer_science, economics };
    for (const [subj, val] of Object.entries(ratings)) {
      const num = parseInt(val);
      if (isNaN(num) || num < 1 || num > 10)
        return res.status(400).json({ error: `Rating for ${subj} must be between 1 and 10.` });
    }

    // Check if form already exists
    const [existing] = await pool.query('SELECT id FROM form_data WHERE user_id = ?', [req.user.id]);
    if (existing.length > 0)
      return res.status(409).json({ error: 'Form already submitted. Use PUT to update.' });

    const [result] = await pool.query(
      `INSERT INTO form_data
        (user_id, phone, gender, languages, english, hindi, biology, physics, chemistry,
         mathematics, history, geography, computer_science, economics)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, phone, gender, JSON.stringify(languages),
        english, hindi, biology, physics, chemistry,
        mathematics, history, geography, computer_science, economics
      ]
    );

    res.status(201).json({ message: 'Form submitted successfully!', formId: result.insertId });
  } catch (err) {
    console.error('Submit form error:', err);
    res.status(500).json({ error: 'Failed to submit form.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/forms/:id — Update an existing form
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.id);
    const {
      phone, gender, languages,
      english, hindi, biology, physics, chemistry,
      mathematics, history, geography, computer_science, economics
    } = req.body;

    // Make sure the form belongs to this user
    const [rows] = await pool.query(
      'SELECT id FROM form_data WHERE id = ? AND user_id = ?',
      [formId, req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: 'Form not found or access denied.' });

    if (phone && !/^\d{10}$/.test(phone))
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });

    await pool.query(
      `UPDATE form_data SET
        phone = ?, gender = ?, languages = ?,
        english = ?, hindi = ?, biology = ?, physics = ?, chemistry = ?,
        mathematics = ?, history = ?, geography = ?, computer_science = ?, economics = ?
       WHERE id = ? AND user_id = ?`,
      [
        phone, gender, JSON.stringify(languages),
        english, hindi, biology, physics, chemistry,
        mathematics, history, geography, computer_science, economics,
        formId, req.user.id
      ]
    );

    res.json({ message: 'Form updated successfully!' });
  } catch (err) {
    console.error('Update form error:', err);
    res.status(500).json({ error: 'Failed to update form.' });
  }
});

module.exports = router;
