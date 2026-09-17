# College Attendance Management System

A full-stack, enterprise-grade, fully responsive **College Attendance Management System** built with **HTML5, CSS3, Vanilla JavaScript**, **Node.js + Express.js**, and **MongoDB Atlas / Mongoose**.

---

## 🌟 Key Features

### 🎓 Student Role
- **Login & Profile View**: Authenticate using Roll Number, Student ID, or Email.
- **Overall Attendance**: Circular visual progress indicator showing overall percentage.
- **Subject-Wise Attendance**: Table detailing present, absent, total classes, percentage, and status indicators (Good, Warning, Shortage).
- **Shortage Warning System**: Dynamic alert banner calculating classes required to reach the minimum percentage threshold (default 75%).
- **Attendance History**: Search and filter past session logs by date, subject, and status.
- **Notifications**: View administrative announcements and low-attendance warnings.

### 👨‍🏫 Faculty Role
- **Faculty Dashboard**: Overview of assigned subjects, active classes, and today's sessions marked.
- **Mark Attendance Portal**: Filter by Department, Class, Section, Subject, Date, and Period. Interactive table with "Mark All Present" / "Mark All Absent" buttons and duplicate session prevention.
- **Attendance Editing**: Modify previously marked attendance with automatic audit logging.
- **Reports & Export**: Generate student and subject reports with single-click CSV export and print capability.

### 🛡️ Admin Role
- **System Dashboard**: Analytics metrics for Total Students, Faculty, Departments, Subjects, Today's Attendance %, and Low-Attendance Callouts.
- **Interactive Analytics**: Department-wise attendance comparison charts powered by Chart.js.
- **Student Management**: Full CRUD operations for students with automatic User credential generation.
- **Faculty Management**: Full CRUD operations for faculty members.
- **Academic Setup**: Manage Departments, Courses, Classes, Sections, and Subjects.
- **Faculty-Subject Assignment**: Map faculty members to specific subjects and class sections.
- **System Settings**: Configure minimum attendance threshold percentage and faculty editing permissions.
- **Audit Logging**: Traceable logging of critical system actions.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla CSS with CSS Variables & Glassmorphism), Vanilla JavaScript (ES6 Modules)
- **Backend**: Node.js, Express.js REST API
- **Database**: MongoDB Atlas / Mongoose ORM
- **Authentication**: JWT (JSON Web Tokens) & Password Hashing via `bcryptjs`
- **Security**: Express Rate Limiting, Role Authorization Middlewares, Input Validation

---

## 📁 Folder Structure

```
college-attendance/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── facultyController.js
│   │   ├── academicController.js
│   │   ├── attendanceController.js
│   │   ├── dashboardController.js
│   │   ├── reportController.js
│   │   ├── notificationController.js
│   │   ├── auditController.js
│   │   └── settingsController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   ├── Department.js
│   │   ├── Course.js
│   │   ├── Class.js
│   │   ├── Section.js
│   │   ├── Subject.js
│   │   ├── Assignment.js
│   │   ├── Attendance.js
│   │   ├── Notification.js
│   │   ├── AuditLog.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── facultyRoutes.js
│   │   ├── academicRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── auditRoutes.js
│   │   └── settingsRoutes.js
│   ├── utils/
│   │   ├── auditLogger.js
│   │   └── helpers.js
│   ├── seed/
│   │   └── seedData.js
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── student/
│   ├── faculty/
│   ├── admin/
│   ├── css/
│   └── js/
├── .gitignore
└── README.md
```

---

## 🚀 Step-by-Step Setup Guide

### 1. Open Project in VS Code
Open VS Code and navigate to `File -> Open Folder...` and select the project directory.

### 2. Install Backend Dependencies
Open the Terminal in VS Code (`Ctrl + ~` or `Terminal -> New Terminal`) and run:

```bash
cd backend
npm install
```

### 3. Configure MongoDB Atlas & Environment Variables
In the `backend/` folder, check `.env`. If you want to use MongoDB Atlas:

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. Create a Cluster & Database (e.g. `college_attendance`).
3. Under **Database Access**, create a database user and password.
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere).
5. Copy your connection string and set `MONGODB_URI` in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/college_attendance?retryWrites=true&w=majority
JWT_SECRET=super_secret_college_attendance_jwt_key_2026
JWT_EXPIRE=30d
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=Admin@123
```

*(Note: If you have MongoDB installed locally, you can keep `mongodb://127.0.0.1:27017/college_attendance`)*

### 4. Seed Initial Database Data
Run the database seed script to populate initial Admin, Departments, Subjects, Faculty, Students, and historical attendance records:

```bash
npm run seed
```

### 5. Start Backend Server
Start the Express REST API server:

```bash
npm run dev
# or
npm start
```
The server will start at `http://localhost:5000`.

### 6. Launch Frontend
Open `frontend/index.html` directly in your browser, or serve it using VS Code **Live Server** extension (or via the backend at `http://localhost:5000`).

---

## 🔑 Default Login Credentials (From Seed Script)

| Role | Username / Identifier | Password | Access Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `Admin@123` | `/admin/dashboard.html` |
| **Faculty** | `FAC001` or `robert.vance@college.edu` | `Faculty@123` | `/faculty/dashboard.html` |
| **Faculty** | `FAC002` or `sarah.jenkins@college.edu` | `Faculty@123` | `/faculty/dashboard.html` |
| **Student** | `24CS001` or `aarav.sharma@student.edu` | `Student@123` | `/student/dashboard.html` |
| **Student** | `24CS003` (Shortage Case) | `Student@123` | `/student/dashboard.html` |

---

## 📡 API Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login user & return JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Protected |
| `GET` | `/api/dashboard/admin` | Fetch Admin stats & analytics | Admin |
| `GET` | `/api/dashboard/faculty` | Fetch Faculty dashboard metrics | Faculty |
| `GET` | `/api/dashboard/student` | Fetch Student percentage & stats | Student |
| `POST` | `/api/attendance/mark` | Mark bulk class attendance | Faculty/Admin |
| `GET` | `/api/attendance/student/:id` | Subject-wise student attendance | Protected |
| `GET` | `/api/reports` | Export/generate filtered reports | Faculty/Admin |

---

## 🔒 Security Measures
- Passwords securely hashed with `bcryptjs`.
- JWT token authentication required for protected API endpoints.
- Role-based route guards prevent unauthorized access.
- Compound unique index on `{ student, subject, date, period }` prevents duplicate attendance records.

---

## 🌐 Deployment Instructions

### Deploying Backend (Render / Railway / Heroku)
1. Push `backend/` to a Git repository.
2. Set Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `PORT`).
3. Set start command to `node server.js`.

### Deploying Frontend (Vercel / Netlify / GitHub Pages)
1. Set `API_BASE_URL` in `frontend/js/config.js` to your deployed backend URL (e.g. `https://your-api.onrender.com/api`).
2. Deploy the `frontend/` folder.
