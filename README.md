# 🎓 College Subject Rating System

A full-stack web application for college students to rate their subjects, with an admin dashboard and analytics.

---

## 🗂️ Project Structure

```
Form website/
├── backend/                 ← Node.js + Express API
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   ├── .env                 ← ⚠️ Update DB credentials here
│   ├── setup/
│   │   └── schema.js        ← DB init script (run once)
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── routes/
│       ├── auth.js
│       ├── forms.js
│       ├── users.js
│       └── analytics.js
├── public/                  ← Frontend (HTML/CSS/JS)
│   ├── login.html
│   ├── index.html           ← Home page
│   ├── form.html
│   ├── help.html
│   ├── admin.html
│   ├── analytics.html
│   ├── css/styles.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── home.js
│       ├── form.js
│       ├── admin.js
│       ├── analytics.js
│       └── help.js
├── README.md
└── GOOGLE_AUTH_SETUP.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MySQL 8+ running on port 3306

### 1. Configure Environment
Edit `backend/.env` — update `DB_PASS` with your MySQL root password:
```
DB_PASS=your_mysql_password_here
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Initialize Database
```bash
npm run setup
```
This creates the `college_ratings` database, all 3 tables, and a default admin account.

**Default Admin:**
- Username: `admin`
- Password: `admin123`
- ⚠️ Change this via the database after first login!

### 4. Start the Server
```bash
npm run dev     # Development (with auto-reload)
npm start       # Production
```

### 5. Open the App
Visit: **http://localhost:3000**

---

## 🌐 Pages

| URL | Description | Access |
|-----|-------------|--------|
| `/login.html` | Student & Admin login | Public |
| `/index.html` | Student home / form selection | Students |
| `/form.html` | Subject rating form | Students |
| `/help.html` | FAQ & support | Public |
| `/admin.html` | User management dashboard | Admin only |
| `/analytics.html` | Charts & analytics | Admin only |

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Student accounts |
| `admin_data` | Admin accounts |
| `form_data` | Student form submissions (ratings + personal info) |

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register student |
| POST | `/api/auth/login` | None | Student login |
| POST | `/api/auth/admin-login` | None | Admin login |
| GET | `/api/auth/me` | JWT | Current user info |
| GET | `/api/forms/my` | Student JWT | Get student's form |
| POST | `/api/forms` | Student JWT | Submit form |
| PUT | `/api/forms/:id` | Student JWT | Update form |
| GET | `/api/users` | Admin JWT | List all students |
| POST | `/api/users` | Admin JWT | Add student |
| PUT | `/api/users/:id` | Admin JWT | Edit student |
| DELETE | `/api/users/:id` | Admin JWT | Delete student |
| GET | `/api/analytics/summary` | Admin JWT | Analytics data |
| GET | `/api/health` | None | Health check |

---

## 🔐 Authentication

- **Students**: Email + Password → JWT stored in `localStorage`
- **Admins**: Username + Password → JWT with `role: 'admin'`
- JWT expires in **7 days**
- Google OAuth: Not yet active. See [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)

---

## 🚢 Deployment

### Environment Variables for Production
```env
PORT=3000
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=college_ratings
JWT_SECRET=a-very-long-random-secret-string-here
FRONTEND_URL=https://yourdomain.com
```

### Using PM2 (recommended for servers)
```bash
npm install -g pm2
pm2 start server.js --name college-rating
pm2 save
pm2 startup
```

### Docker (optional)
Add a `Dockerfile` and `docker-compose.yml` if containerization is needed.

---

## 🛡️ Security Notes
- Change `JWT_SECRET` to a long random string in production
- Change admin password after first login
- Set `DB_PASS` to a strong password
- Use HTTPS in production (e.g., via nginx reverse proxy)
