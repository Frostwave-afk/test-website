# Password Login Issue - Diagnostic & Fix Guide

## Problem
Login failing with stored credentials from Railway database. Likely cause: **plain text passwords instead of bcrypt hashes**.

## Quick Diagnosis (3 steps)

### Step 1: Test the Debug Endpoint
```bash
# From your frontend, open browser console and run:
fetch('https://test-website-production-1b48.up.railway.app/api/auth/debug-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'your-email@example.com', 
    password: 'your-password' 
  })
})
.then(r => r.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
```

**Look for:**
- `success: true` → Password is correct, issue is elsewhere
- `success: false` → Password doesn't match
- `isBcryptHash: false` → Password stored as plain text (THIS IS THE ISSUE)

### Step 2: Run Password Fix Script
```bash
# From backend folder
cd backend
node fix-passwords.js
```

This will:
- Detect all plain text passwords
- Convert them to secure bcrypt hashes
- Preserve password functionality

### Step 3: Test Login
- Try logging in again with same credentials
- Should work now!

## What's Happening

**Before fix:**
```
Database stores: "password123"  ← Plain text
Login tries: bcrypt.compare("password123", "password123")  ← Fails!
```

**After fix:**
```
Database stores: "$2b$12$..." ← Bcrypt hash
Login tries: bcrypt.compare("password123", "$2b$12$...")  ← Works!
```

## Check Current State

### Option A: Check via debug endpoint (easiest)
See Step 1 above

### Option B: Check database directly
```sql
SELECT email, password_hash, LENGTH(password_hash) as hash_length 
FROM users 
LIMIT 5;
```

**Signs of plain text passwords:**
- `hash_length` < 59 characters
- `password_hash` doesn't start with `$2b$` or `$2a$`

## Apply Fix

**Local development:**
```bash
cd backend
node fix-passwords.js
npm run dev
```

**Production (Railway):**
1. SSH into Railway container OR use Railway CLI
2. Run: `node fix-passwords.js`
3. Test login

**Or deploy the fix:**
```bash
git add .
git commit -m "Add password hashing fix"
git push
# Railway auto-deploys
```

## Verify Password Field Structure

The `password_hash` column should be:
```sql
password_hash VARCHAR(255) NOT NULL
```

Bcrypt hashes are ~60 characters starting with `$2b$12$` or `$2a$`

## After Fix

Login will work with:
- **Email:** your-email@example.com
- **Password:** same password as stored in DB (before fix)

## Still Having Issues?

1. **Check bcrypt version**: `npm list bcrypt` (should be same version in frontend builder and backend)
2. **Verify DB connection**: Check if Railway DB credentials are correct
3. **Check CORS**: Ensure frontend domain is whitelisted on backend
4. **Check JWT Secret**: Must be same in registration and login

Test endpoint: https://test-website-production-1b48.up.railway.app/api/health
