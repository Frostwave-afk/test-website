#!/usr/bin/env node

/**
 * Password Fix Script
 * 
 * This script detects plain text passwords and rehashes them with bcrypt.
 * Plain text passwords look like: "password" or simple strings
 * Bcrypt hashes start with "$2b$" and are ~60 characters long
 * 
 * Run with: node fix-passwords.js
 */

const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPasswords() {
  let conn;
  try {
    console.log('\n🔐 Scanning for plain text passwords...\n');
    
    conn = await pool.getConnection();

    // Get all users
    const [users] = await conn.query('SELECT id, email, password_hash FROM users');
    let fixed = 0;
    let alreadyHashed = 0;

    for (const user of users) {
      if (!user.password_hash) {
        console.log(`⏭️  Skipped ${user.email} (no password set)`);
        continue;
      }

      // Check if already bcrypt hashed (starts with $2b$ or $2a$ and ~60 chars)
      const isBcryptHash = /^\$2[aby]\$/.test(user.password_hash) && user.password_hash.length >= 59;

      if (isBcryptHash) {
        alreadyHashed++;
      } else {
        // Plain text password - rehash it
        console.log(`🔄 Rehashing plain text password for ${user.email}`);
        const newHash = await bcrypt.hash(user.password_hash, 12);
        await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
        fixed++;
      }
    }

    console.log('\n✅ Password Fix Summary:');
    console.log(`   • Already hashed: ${alreadyHashed}`);
    console.log(`   • Fixed: ${fixed}`);
    console.log(`   • Total users: ${users.length}\n`);

    if (fixed > 0) {
      console.log('✨ Plain text passwords have been securely hashed!\n');
    } else {
      console.log('✅ All passwords are already properly hashed.\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

fixPasswords();
