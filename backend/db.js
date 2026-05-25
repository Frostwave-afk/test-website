const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST || 'localhost',
  port:             parseInt(process.env.DB_PORT) || 3306,
  user:             process.env.DB_USER || 'root',
  password:         process.env.DB_PASS || '',
  database:         process.env.DB_NAME || 'college_ratings',
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0,
  enableKeepAlive:  true,
  keepAliveInitialDelay: 0,
  dateStrings:      true
});

// Test the connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully to:', process.env.DB_NAME || 'college_ratings');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   → Check DB_HOST, DB_USER, DB_PASS, DB_NAME in backend/.env');
    console.error('   → Make sure MySQL is running and the database exists (run: npm run setup)');
  }
})();

module.exports = pool;
