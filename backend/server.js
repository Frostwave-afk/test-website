const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (Frontend) ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/forms',     require('./routes/forms'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── Catch-all: Serve Login Page ──────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  🎓 College Rating System — Running!          ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  🌐 App:     http://localhost:${PORT}             ║`);
  console.log(`║  🔑 Login:   http://localhost:${PORT}/login.html  ║`);
  console.log(`║  📊 Admin:   http://localhost:${PORT}/admin.html  ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Press Ctrl+C to stop                        ║');
  console.log('╚══════════════════════════════════════════════╝\n');
});
