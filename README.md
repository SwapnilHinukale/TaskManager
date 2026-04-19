# TaskFlow — Full-Stack Task Management App

A full-featured collaborative task management application with JWT authentication, role-based permissions, and a modern dark UI.

---

## Project Structure

```
taskflow/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT protect middleware
│   ├── models/
│   │   ├── User.js             # User schema (hashed passwords)
│   │   └── Task.js             # Task schema
│   ├── routes/
│   │   ├── auth.js             # /api/auth (register, login, me)
│   │   ├── tasks.js            # /api/tasks (full CRUD)
│   │   └── users.js            # /api/users/search
│   ├── server.js
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Top navigation bar
│   │   │   └── TaskCard.jsx     # Task card with inline status update
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── TaskFormPage.jsx # Create + Edit (role-aware)
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance with JWT interceptors
│   │   ├── App.jsx              # Routes + protected routes
│   │   ├── index.js
│   │   └── index.css            # Design system + global styles
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
# Clone the repo and run everything with one command
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

---

### Option B — Manual Setup

#### 1. Start MongoDB

Make sure MongoDB is running locally on port 27017, or use MongoDB Atlas.

#### 2. Backend

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm start
# Server runs on http://localhost:5000
```

#### 3. Frontend

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api

npm start
# App runs on http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## API Reference

### Auth Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login + get JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Task Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks` | Yes | Get all visible tasks |
| GET | `/api/tasks?type=personal` | Yes | Filter: personal tasks only |
| GET | `/api/tasks?type=assigned_by_me` | Yes | Filter: tasks you assigned |
| GET | `/api/tasks?type=assigned_to_me` | Yes | Filter: tasks assigned to you |
| GET | `/api/tasks?status=Todo` | Yes | Filter by status |
| GET | `/api/tasks/:id` | Yes | Get single task |
| POST | `/api/tasks` | Yes | Create task |
| PUT | `/api/tasks/:id` | Yes | Update task (role-based) |
| DELETE | `/api/tasks/:id` | Yes | Delete task (creator only) |

### User Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/search?q=...` | Yes | Search users to assign |

---

## Security Features

- Passwords hashed with **bcryptjs** (12 salt rounds)
- JWT tokens with configurable expiry
- All task routes protected by `protect` middleware
- Users can only access tasks they created or are assigned to
- Role enforcement happens server-side (not just UI)
- CORS configured to allow only the frontend origin

---

## Features

### Authentication
- User registration with validation
- Secure login with JWT
- Protected routes (frontend + backend)
- Persistent sessions via localStorage

### Task Management
- Create personal or assigned tasks
- View all tasks with filter tabs (All / Personal / Assigned by Me / Assigned to Me)
- Filter by status (Todo / In Progress / Done)
- Inline status update directly from the dashboard
- Edit and delete tasks

### UI Highlights
- Dark mode design with Syne + DM Sans fonts
- Status color-coded left border on task cards
- Overdue date highlighting
- Live user search with debounce for assigning tasks
- Stats summary bar (total, todo, in progress, done)
- Responsive layout

### User Details

## User 1
username = user1
email = user1@gmail.com
password = user@1

### User 2
username = user2
email = user2@gmail.com
password = user@2