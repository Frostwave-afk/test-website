const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All analytics routes require admin auth
router.use(authMiddleware, adminMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/summary — Full analytics data for all charts
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    // ── Subject averages ─────────────────────────────────────────────────────
    const [[subjectAvg]] = await pool.query(`
      SELECT
        ROUND(AVG(english), 2)          AS english,
        ROUND(AVG(hindi), 2)            AS hindi,
        ROUND(AVG(biology), 2)          AS biology,
        ROUND(AVG(physics), 2)          AS physics,
        ROUND(AVG(chemistry), 2)        AS chemistry,
        ROUND(AVG(mathematics), 2)      AS mathematics,
        ROUND(AVG(history), 2)          AS history,
        ROUND(AVG(geography), 2)        AS geography,
        ROUND(AVG(computer_science), 2) AS computer_science,
        ROUND(AVG(economics), 2)        AS economics
      FROM form_data
    `);

    // ── Gender-based subject averages ────────────────────────────────────────
    const [genderAvg] = await pool.query(`
      SELECT
        gender,
        COUNT(*) AS count,
        ROUND(AVG(english), 2)          AS english,
        ROUND(AVG(hindi), 2)            AS hindi,
        ROUND(AVG(biology), 2)          AS biology,
        ROUND(AVG(physics), 2)          AS physics,
        ROUND(AVG(chemistry), 2)        AS chemistry,
        ROUND(AVG(mathematics), 2)      AS mathematics,
        ROUND(AVG(history), 2)          AS history,
        ROUND(AVG(geography), 2)        AS geography,
        ROUND(AVG(computer_science), 2) AS computer_science,
        ROUND(AVG(economics), 2)        AS economics
      FROM form_data
      WHERE gender IS NOT NULL
      GROUP BY gender
    `);

    // ── Gender distribution ──────────────────────────────────────────────────
    const [genderDist] = await pool.query(`
      SELECT gender, COUNT(*) AS count
      FROM form_data
      WHERE gender IS NOT NULL
      GROUP BY gender
    `);

    // ── Rating distribution per subject (count of each rating 1-10) ─────────
    const [ratingDist] = await pool.query(`
      SELECT
        english AS rating, 'English' AS subject FROM form_data
      UNION ALL SELECT hindi,            'Hindi'            FROM form_data
      UNION ALL SELECT biology,          'Biology'          FROM form_data
      UNION ALL SELECT physics,          'Physics'          FROM form_data
      UNION ALL SELECT chemistry,        'Chemistry'        FROM form_data
      UNION ALL SELECT mathematics,      'Mathematics'      FROM form_data
      UNION ALL SELECT history,          'History'          FROM form_data
      UNION ALL SELECT geography,        'Geography'        FROM form_data
      UNION ALL SELECT computer_science, 'Computer Science' FROM form_data
      UNION ALL SELECT economics,        'Economics'        FROM form_data
    `);

    // ── Monthly submission trend ─────────────────────────────────────────────
    const [monthlyTrend] = await pool.query(`
      SELECT
        DATE_FORMAT(submitted_at, '%Y-%m') AS month,
        COUNT(*) AS count
      FROM form_data
      GROUP BY DATE_FORMAT(submitted_at, '%Y-%m')
      ORDER BY month ASC
      LIMIT 12
    `);

    // ── Language distribution ────────────────────────────────────────────────
    const [langRows] = await pool.query(`SELECT languages FROM form_data WHERE languages IS NOT NULL`);
    const langCount = {};
    for (const row of langRows) {
      let langs = row.languages;
      if (typeof langs === 'string') { try { langs = JSON.parse(langs); } catch { langs = []; } }
      if (Array.isArray(langs)) {
        for (const lang of langs) {
          langCount[lang] = (langCount[lang] || 0) + 1;
        }
      }
    }
    const languageDist = Object.entries(langCount).map(([language, count]) => ({ language, count }));

    // ── Overview stats ───────────────────────────────────────────────────────
    const [[overview]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users)     AS total_students,
        (SELECT COUNT(*) FROM form_data) AS total_submissions,
        (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) AS new_today
    `);

    res.json({
      subjectAvg,
      genderAvg,
      genderDist,
      ratingDist,
      monthlyTrend,
      languageDist,
      overview
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/subject/:name — Detailed stats for one subject
// ─────────────────────────────────────────────────────────────────────────────
router.get('/subject/:name', async (req, res) => {
  const allowed = ['english','hindi','biology','physics','chemistry',
                   'mathematics','history','geography','computer_science','economics'];
  const subj = req.params.name.toLowerCase();
  if (!allowed.includes(subj))
    return res.status(400).json({ error: 'Invalid subject name.' });

  try {
    const [dist] = await pool.query(
      `SELECT ${subj} AS rating, COUNT(*) AS count
       FROM form_data WHERE ${subj} IS NOT NULL
       GROUP BY ${subj} ORDER BY rating`,
    );
    const [[avg]] = await pool.query(`SELECT ROUND(AVG(${subj}), 2) AS avg FROM form_data`);
    res.json({ subject: subj, distribution: dist, average: avg.avg });
  } catch (err) {
    console.error('Subject analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch subject analytics.' });
  }
});

module.exports = router;
