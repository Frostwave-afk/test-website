# 🎓 College Subject Rating System

A full-stack web application for college students to rate their subjects, with an admin dashboard and analytics.

**Deployment:**
- 🌐 **Frontend**: Vercel (auto-deploys from GitHub)
- ⚙️ **Backend**: Railway (auto-deploys from GitHub)  
- 🗄️ **Database**: MySQL (cloud-hosted)

---

## 📋 Features

✅ Student registration & login  
✅ Subject rating form (10-point scale)  
✅ Admin dashboard for user management  
✅ Form submission tracking  
✅ Analytics & statistics  
✅ Secure JWT authentication  
✅ Password change for admins  

---

## 🗂️ Project Structure

```
Form website/
├── backend/                 ← Node.js + Express API
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── .env                 ← Database credentials
│   ├── setup/
│   │   └── schema.js        ← DB initialization
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── routes/
│       ├── auth.js          ← Login, registration, password change
│       ├── forms.js         ← Form submissions
│       ├── users.js         ← User management (admin)
│       └── analytics.js     ← Stats & analytics
├── public/                  ← Frontend (HTML/CSS/JS)
│   ├── login.html           ← Student & admin login
│   ├── index.html           ← Student home page
│   ├── form.html            ← Subject rating form
│   ├── help.html            ← FAQ & support
│   ├── admin.html           ← Admin dashboard
│   ├── analytics.html       ← Analytics page
│   ├── css/styles.css       ← Styling
│   └── js/
│       ├── api.js           ← API client (Railway backend)
│       ├── auth.js          ← Login/register logic
│       ├── home.js          ← Home page logic
│       ├── form.js          ← Form submission logic
│       ├── admin.js         ← Admin dashboard logic
│       ├── analytics.js     ← Analytics logic
│       └── help.js          ← Help page logic
├── README.md
├── GOOGLE_AUTH_SETUP.md
└── .gitignore
```

---

## 🌐 Live Pages

| URL | Description | Access |
|-----|-------------|--------|
| `/login.html` | Student & Admin login | Public |
| `/index.html` | Student home / form selection | Students |
| `/form.html` | Subject rating form | Students |
| `/help.html` | FAQ & support | Public |
| `/admin.html` | User management & profile | Admin only |
| `/analytics.html` | Charts & statistics | Admin only |

---

## 🗄️ Database Tables

| Table | Purpose | Fields |
|-------|---------|--------|
| `users` | Student accounts | id, first_name, last_name, email, password_hash, created_at |
| `admin_data` | Admin accounts | id, username, email, full_name, password_hash, role, created_at |
| `form_data` | Subject ratings | id, user_id, phone, gender, languages, english, hindi, biology, physics, chemistry, mathematics, history, geography, computer_science, economics, submitted_at |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Student registration |
| POST | `/api/auth/login` | None | Student login |
| POST | `/api/auth/admin-login` | None | Admin login |
| POST | `/api/auth/change-password` | Admin JWT | Change admin password |
| GET | `/api/auth/me` | JWT | Get current user info |

### Forms
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/forms/my` | Student JWT | Get student's submitted form |
| POST | `/api/forms` | Student JWT | Submit form ratings |
| PUT | `/api/forms/:id` | Student JWT | Update form |
| GET | `/api/forms/all` | Admin JWT | Get all submissions (CSV export) |

### Users (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin JWT | List all students (paginated) |
| GET | `/api/users/:id` | Admin JWT | Get student details |
| GET | `/api/users/:id/form` | Admin JWT | Get student's form submission |
| POST | `/api/users` | Admin JWT | Add new student |
| PUT | `/api/users/:id` | Admin JWT | Edit student |
| DELETE | `/api/users/:id` | Admin JWT | Delete student |
| GET | `/api/users/stats/summary` | Admin JWT | Get dashboard statistics |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/summary` | Admin JWT | Get analytics data |

### Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Server health check |

---

## 🔐 Authentication

- **Students**: Email + Password → JWT
- **Admins**: Username + Password → JWT with `role: 'admin'`
- **JWT Storage**: `localStorage` as `crs_token`
- **JWT Expiry**: 7 days
- **Password Hashing**: bcryptjs (12 rounds)

### Default Admin Account
- Username: `admin`
- Password: `admin123` (shown during `npm run setup`)
- ⚠️ **Change immediately via "My Profile" → "Change Password" after first login**
- ⚠️ **Never use default credentials in production**

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+
- npm or yarn
- MySQL 8+ (local or cloud-hosted)

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Configure `.env` (NOT included in repo)
Create `backend/.env` with your database credentials:
```env
PORT=8080
DB_HOST=your-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASS=your-secure-password

JWT_SECRET=your-long-random-secret-string
JWT_EXPIRES_IN=7d
FRONTEND_URL=your-frontend-url
```
⚠️ **`.env` is in `.gitignore` — never commit this file!**

### 3. Initialize Database
```bash
npm run setup
```
Creates tables and seeds default admin account (credentials will be shown in console).

### 4. Start Backend
```bash
npm run dev     # Development (auto-reload)
npm start       # Production
```

### 5. Start Frontend
```bash
# In a new terminal
cd public
python -m http.server 3000
```

Visit: **http://localhost:3000**

---

## 🚢 Deployment

### Current Setup
- **Frontend**: Deployed on Vercel (auto-deploys on git push)
- **Backend**: Deployed on Railway (auto-deploys on git push)
- **Database**: Cloud-hosted MySQL

### To Deploy Changes
1. Make code changes locally
2. `git add .`
3. `git commit -m "your message"`
4. `git push`
5. Vercel & Railway auto-deploy within 1-2 minutes

### Production Environment Variables

**Set these in your hosting provider (NOT in code):**
```
PORT=production-port
DB_HOST=your-production-db-host
DB_PORT=your-db-port
DB_USER=your-production-user
DB_PASS=your-production-password
DB_NAME=your-db-name

FRONTEND_URL=https://your-frontend-domain
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=7d
```

**Never hardcode secrets in code or README!**

---

## 🛡️ Security Checklist

- ✅ `.env` file in `.gitignore` (not committed)
- ✅ Passwords hashed with bcryptjs (12 rounds)
- ✅ JWT tokens with configurable expiry
- ✅ CORS enabled for frontend only
- ✅ Admin password changeable via profile
- ⚠️ **Set unique `JWT_SECRET` per environment**
- ⚠️ **Use strong `DB_PASS` in production**
- ⚠️ **Use HTTPS on all domains**
- ⚠️ **Rotate secrets regularly**
- ⚠️ **Never commit `.env` files**

---

## 📝 Recent Updates

- ✅ Deployed to Vercel (frontend) & Railway (backend)
- ✅ Added admin password change functionality
- ✅ Removed password visibility toggle from admin login
- ✅ Removed default credentials from UI
- ✅ Database initialized with schema & default admin

---

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Make changes
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/your-feature`
5. Open a pull request

---

## 📧 Support

For issues or questions, please refer to [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md) for OAuth setup or contact the administrator.

---

**Last Updated**: May 25, 2026  
**Status**: 🟢 Live & Fully Deployed
