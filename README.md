# Team Task Manager

A full-stack team task manager with real-time updates, role-based access, and project collaboration.

## Features

- Authentication (signup, login, session restore)
- Project creation and membership management
- Invitations (send, accept, reject)
- Task assignment, status updates, and reassignment
- Member and admin dashboards
- Real-time updates using Socket.IO

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, MongoDB, Mongoose
- Realtime: Socket.IO

## Setup

### 1) Backend

```bash
cd backend
npm install
```

Create a .env file in backend/:

```
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
```

Create a .env file in frontend/ (optional):

```
VITE_API_URL=http://localhost:5000/api
# Optional if your socket server is on a different base URL
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open http://localhost:5173

## Actions and How They Work

### Auth

- Signup: creates a user and stores a JWT in localStorage.
- Login: verifies credentials and stores a JWT in localStorage.
- Session restore: the frontend calls /auth/me on load to validate the token.

### Projects

- Create project: creates a project where the creator becomes Admin.
- My projects: list of projects where you are Admin or Member.
- Open project: shows members, tasks, and progress for that project.

### Invitations

- Send invite: Admin sends an invite by email.
- Receive invite: recipient sees the invite in the bell menu.
- Accept invite: recipient joins the project as a Member.
- Reject invite: invite is removed.

### Tasks

- Assign task: Admin assigns a task to a member.
- Update status: assigned member or Admin can change status.
- Reassign task: Admin can change the assignee.

### Dashboards

- Member dashboard: shows personal task stats.
- Admin dashboard: shows project-wide stats for an Admin-selected project.

### Realtime Updates

- Invitations, project lists, tasks, and progress update instantly via Socket.IO.
- Clients join project rooms for project-scoped updates.

## API Overview

Base URL: /api

- Auth: /auth/signup, /auth/login, /auth/me
- Projects: /projects, /projects/my, /projects/:id
- Invitations: /invitations, /invitations/:id/respond
- Tasks: /tasks, /tasks/project/:projectId, /tasks/:taskId/status
- Dashboard: /dashboard/member, /dashboard/admin/:projectId

## Notes

- Admin can invite members and assign/reassign tasks.
- Member access is enforced on project and task routes.
