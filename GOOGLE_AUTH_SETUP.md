# Google Sign-In Setup Guide

This guide walks you through enabling Google OAuth login for the College Rating System.

## Overview

The "Sign in with Google" button is already in the UI but is **disabled** with a "Coming Soon" badge. Once you follow these steps, it will work end-to-end.

---

## Step 1 — Create a Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Click **"New Project"** → name it `College Rating System`
3. Select the project

---

## Step 2 — Enable the Google Identity API

1. In the sidebar, go to **APIs & Services → Library**
2. Search for `Google Identity` and enable it
3. Also enable `Google+ API` if prompted

---

## Step 3 — Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS" → OAuth client ID**
3. Choose **Web application**
4. Set:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000` (for GSI, no redirect needed)
5. Click **Create**
6. Copy your **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)

---

## Step 4 — Update Backend .env

Open `backend/.env` and set:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## Step 5 — Install Google Auth Library

```bash
cd backend
npm install google-auth-library
```

---

## Step 6 — Enable in Backend Route

Open `backend/routes/auth.js` and find the Google route section:

```js
// POST /api/auth/google
router.post('/google', async (req, res) => {
  return res.status(501).json({ error: 'Google Sign-In not yet configured.' });
  /* ── UNCOMMENT BELOW ... */
});
```

Delete the `return res.status(501)...` line and uncomment the block between `/* ── UNCOMMENT BELOW ──` and `── END UNCOMMENT BLOCK ──── */`.

---

## Step 7 — Enable in Frontend HTML

Open `public/login.html` and uncomment this line:

```html
<!-- <script src="https://accounts.google.com/gsi/client" async defer></script> -->
```

Remove the `<!-- -->` comment markers.

---

## Step 8 — Enable the Google Button

Open `public/js/auth.js` and find the `handleGoogleSignIn()` function:

```js
// TODO: GOOGLE AUTH
function handleGoogleSignIn() {
  showToast('Google Sign-In is coming soon!...', 'info');
}
```

Replace it with the actual implementation:

```js
function handleGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
    callback: async (response) => {
      try {
        const data = await AuthAPI.googleAuth(response.credential);
        Auth.setToken(data.token);
        Auth.setUser({ ...data.user, role: 'student' });
        showToast('Signed in with Google!', 'success');
        setTimeout(() => window.location.href = '/index.html', 800);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });
  google.accounts.id.prompt();
}
```

Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID.

---

## Step 9 — Remove "Coming Soon" Badge

In `public/login.html`, find and remove this line from the Google button:

```html
<span class="google-coming-soon">Coming Soon</span>
```

---

## Step 10 — Restart the Server

```bash
cd backend
npm run dev
```

Test by clicking "Continue with Google" on the login page. ✅

---

## For Production

Update authorized origins and redirect URIs in Google Cloud Console to use your production domain (e.g., `https://yourdomain.com`).
