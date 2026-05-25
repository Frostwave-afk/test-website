/**
 * Database Setup Script
 * Run with: npm run setup  (from the backend/ folder)
 *
 * This script:
 *  1. Creates the MySQL database if it doesn't exist
 *  2. Creates all 3 tables (users, admin_data, form_data)
 *  3. Seeds a default superadmin account
 *
 * Default Admin Credentials:
 *   Username : admin
 *   Password : admin123
 *   ⚠️  Change this password after your first login!
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'college_ratings';

async function setup() {
  let conn;
  try {
    console.log('\n🔧 Starting database setup...\n');

    // Connect WITHOUT specifying a database first
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });

    // ── Create database ────────────────────────────────────────────────
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${DB_NAME}' ready`);

    await conn.query(`USE \`${DB_NAME}\``);

    // ── Users table ────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        first_name    VARCHAR(100) NOT NULL,
        last_name     VARCHAR(100) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        google_id     VARCHAR(255),
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table: users');

    // ── Admin data table ───────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_data (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email         VARCHAR(255),
        full_name     VARCHAR(200),
        role          ENUM('superadmin', 'admin') DEFAULT 'admin',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table: admin_data');

    // ── Form data table ────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS form_data (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        user_id          INT NOT NULL,
        phone            VARCHAR(15),
        gender           ENUM('Male', 'Female', 'Other'),
        languages        JSON,
        english          TINYINT UNSIGNED,
        hindi            TINYINT UNSIGNED,
        biology          TINYINT UNSIGNED,
        physics          TINYINT UNSIGNED,
        chemistry        TINYINT UNSIGNED,
        mathematics      TINYINT UNSIGNED,
        history          TINYINT UNSIGNED,
        geography        TINYINT UNSIGNED,
        computer_science TINYINT UNSIGNED,
        economics        TINYINT UNSIGNED,
        submitted_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_form (user_id)
      )
    `);
    console.log('✅ Table: form_data');

    // ── Seed default admin ─────────────────────────────────────────────
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 12);

    await conn.query(`
      INSERT INTO admin_data (username, password_hash, email, full_name, role)
      VALUES ('admin', ?, 'admin@college.edu', 'System Administrator', 'superadmin')
      ON DUPLICATE KEY UPDATE username = username
    `, [adminHash]);
    console.log('✅ Default admin seeded: username=admin, password=admin123');

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  ✅ Database setup complete!                  ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  Admin Login:                                 ║');
    console.log('║    Username : admin                           ║');
    console.log('║    Password : admin123                        ║');
    console.log('║  ⚠️  Change password after first login!       ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log('║  Now run: npm run dev                         ║');
    console.log('╚══════════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Wrong MySQL username/password. Update DB_USER and DB_PASS in backend/.env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('   → MySQL is not running. Start MySQL and try again.');
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

setup();
