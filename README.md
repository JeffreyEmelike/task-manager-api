# 🗂️ Task Manager API

> A production-grade, AI-powered project and task management REST API built with **Node.js**, **TypeScript**, **Express**, and **MongoDB**. Features real-time collaboration via WebSockets, semantic search using vector embeddings, and AI-driven task recommendations via the Claude API.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Real-Time Events (Socket.io)](#real-time-events-socketio)
- [AI Features](#ai-features)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Task Manager API is a backend-only SaaS application that allows teams to organise work into **Workspaces → Projects → Tasks**. It was built as a learning project to master the Node.js + TypeScript + MongoDB stack from scratch, with AI features added in later phases using MongoDB Atlas Vector Search and the Anthropic Claude API.

Phase 1 — Authentication & Users

---

## Features

### ✅ Phase 1 — Authentication (complete)

- User registration and login with **JWT access tokens** (15 min expiry)
- **Refresh token rotation** — single-use refresh tokens cycled on every use
- Password hashing with **bcrypt** (12 salt rounds)
- **Role-based access control** — Admin, Member, Guest
- Protect any route with `authenticate` and `authorize()` middleware

### 🔄 Phase 2 — Projects & Tasks

- Full CRUD for Workspaces, Projects, and Tasks
- Nested subtasks embedded in task documents
- **Real-time updates** via Socket.io — changes broadcast instantly to all connected clients
- File attachments uploaded to Cloudinary
- Immutable **ActivityLog** — every create/update/delete recorded

### 🤖 Phase 3 — AI Integration

- **Semantic search** using MongoDB Atlas Vector Search and OpenAI embeddings
- **Task priority recommendations** via the Claude API
- **Auto-tagging** — AI reads task descriptions and applies category labels

### 🛡️ Phase 4 — Testing & Deployment

- Integration tests with Jest + Supertest
- Security hardening: Helmet, rate limiting, NoSQL sanitization
- Docker containerisation
- Deployed to Railway

---

## Tech Stack

| Layer         | Technology               | Purpose                          |
| ------------- | ------------------------ | -------------------------------- |
| Runtime       | Node.js v20 LTS          | Server-side JavaScript           |
| Language      | TypeScript (strict mode) | Type safety and autocomplete     |
| Framework     | Express.js               | HTTP routing and middleware      |
| Database      | MongoDB Atlas            | Document storage                 |
| ODM           | Mongoose                 | Schema validation and queries    |
| Auth          | JWT + bcrypt             | Stateless auth, password hashing |
| Real-time     | Socket.io                | WebSocket collaboration          |
| File Storage  | Cloudinary               | Task attachments                 |
| Email         | Nodemailer + Resend      | Transactional notifications      |
| Queue         | Bull + Redis             | Background job processing        |
| AI / LLM      | Anthropic Claude API     | Recommendations and tagging      |
| Vector Search | MongoDB Atlas Search     | Semantic similarity search       |
| Testing       | Jest + Supertest         | Integration tests                |
| Deployment    | Railway                  | Cloud hosting                    |

---

## Project Structure

```
task-manager-api/
├── src/
│   ├── config/
│   │   └── db.ts               # MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.ts   # Register, login, refresh
│   │   ├── workspaceController.ts
│   │   ├── projectController.ts
│   │   └── taskController.ts
│   ├── middleware/
│   │   ├── auth.ts             # authenticate + authorize()
│   │   └── errorHandler.ts     # Global error handler
│   ├── models/
│   │   ├── User.ts             # IUser interface + schema
│   │   ├── Workspace.ts
│   │   ├── Project.ts
│   │   ├── Task.ts             # ITask + SubtaskSchema
│   │   └── ActivityLog.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── workspaces.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   └── search.ts
│   ├── services/
│   │   ├── embeddingService.ts   # OpenAI vector generation
│   │   ├── searchService.ts      # Atlas Vector Search
│   │   ├── aiRecommendationService.ts  # Claude API
│   │   ├── uploadService.ts      # Cloudinary
│   │   ├── emailService.ts       # Nodemailer
│   │   └── activityService.ts    # Log helper
│   ├── jobs/
│   │   └── emailQueue.ts         # Bull queue processor
│   ├── sockets/
│   │   └── index.ts              # Socket.io event handlers
│   ├── types/
│   │   └── index.ts              # Shared TypeScript types
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # HTTP server entry point
├── src/tests/
│   ├── auth.test.ts
│   └── tasks.test.ts
├── .env.example                  # Required env var template
├── .gitignore
├── Dockerfile
├── jest.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js v20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (comes with Node)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/task-manager-api.git
cd task-manager-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your real values (see [Environment Variables](#environment-variables) below).

### 4. Run in development mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` and automatically restart when you save a file.

### 5. Verify it works

Open Postman and send:

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "yourpassword"
}
```

You should receive a `201` response with `accessToken` and `refreshToken`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in each value:

```env
# Server
PORT=3000

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskmanager
MONGO_URI_TEST=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskmanager_test

# JWT — use long, random strings (min 32 characters each)
JWT_SECRET=replace_with_a_long_random_string
JWT_REFRESH_SECRET=replace_with_a_different_long_random_string

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email
RESEND_API_KEY=re_...

# Redis (for Bull queues)
REDIS_URL=redis://localhost:6379
```

> ⚠️ **Never commit `.env` to GitHub.** It is listed in `.gitignore`. Add your real values directly in the file — they stay on your machine only.

---

## API Reference

All routes are prefixed with `/api`. Protected routes require:

```
Authorization: Bearer <accessToken>
```

---

### Auth

| Method | Endpoint             | Auth     | Description                         |
| ------ | -------------------- | -------- | ----------------------------------- |
| `POST` | `/api/auth/register` | None     | Create a new user account           |
| `POST` | `/api/auth/login`    | None     | Login and receive token pair        |
| `POST` | `/api/auth/refresh`  | None     | Exchange refresh token for new pair |
| `POST` | `/api/auth/logout`   | Required | Revoke refresh token                |

#### POST `/api/auth/register`

**Request body:**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "securepassword"
}
```

**Response `201`:**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

#### POST `/api/auth/login`

**Request body:**

```json
{
  "email": "alice@example.com",
  "password": "securepassword"
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

#### POST `/api/auth/refresh`

**Request body:**

```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

### Workspaces

| Method   | Endpoint                     | Auth     | Role    | Description            |
| -------- | ---------------------------- | -------- | ------- | ---------------------- |
| `GET`    | `/api/workspaces`            | Required | Any     | List user's workspaces |
| `POST`   | `/api/workspaces`            | Required | Any     | Create a workspace     |
| `GET`    | `/api/workspaces/:id`        | Required | Member+ | Get a workspace        |
| `PATCH`  | `/api/workspaces/:id`        | Required | Admin   | Update workspace       |
| `DELETE` | `/api/workspaces/:id`        | Required | Admin   | Delete workspace       |
| `POST`   | `/api/workspaces/:id/invite` | Required | Admin   | Invite a member        |

#### POST `/api/workspaces`

**Request body:**

```json
{
  "name": "Engineering Team"
}
```

**Response `201`:**

```json
{
  "_id": "64f...",
  "name": "Engineering Team",
  "owner": "64e...",
  "members": [{ "user": "64e...", "role": "admin" }],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Projects

| Method   | Endpoint                        | Auth     | Description                |
| -------- | ------------------------------- | -------- | -------------------------- |
| `GET`    | `/api/workspaces/:wid/projects` | Required | List projects in workspace |
| `POST`   | `/api/workspaces/:wid/projects` | Required | Create a project           |
| `GET`    | `/api/projects/:id`             | Required | Get a project              |
| `PATCH`  | `/api/projects/:id`             | Required | Update a project           |
| `DELETE` | `/api/projects/:id`             | Required | Delete a project           |

---

### Tasks

| Method   | Endpoint                   | Auth     | Description             |
| -------- | -------------------------- | -------- | ----------------------- |
| `GET`    | `/api/projects/:pid/tasks` | Required | List tasks in a project |
| `POST`   | `/api/projects/:pid/tasks` | Required | Create a task           |
| `GET`    | `/api/tasks/:id`           | Required | Get a task              |
| `PATCH`  | `/api/tasks/:id`           | Required | Update a task           |
| `DELETE` | `/api/tasks/:id`           | Required | Delete a task           |
| `POST`   | `/api/tasks/:id/comments`  | Required | Add a comment           |

#### POST `/api/projects/:pid/tasks`

**Request body:**

```json
{
  "title": "Fix login bug",
  "description": "Users cannot log in after password reset",
  "priority": "high",
  "status": "todo",
  "dueDate": "2024-03-01T00:00:00.000Z",
  "assignee": "64e..."
}
```

**Response `201`:**

```json
{
  "_id": "64f...",
  "title": "Fix login bug",
  "description": "Users cannot log in after password reset",
  "project": "64e...",
  "assignee": "64e...",
  "priority": "high",
  "status": "todo",
  "subtasks": [],
  "attachments": [],
  "dueDate": "2024-03-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### AI & Search

| Method | Endpoint                   | Auth     | Description                  |
| ------ | -------------------------- | -------- | ---------------------------- |
| `GET`  | `/api/search?q=your+query` | Required | Semantic search across tasks |
| `GET`  | `/api/tasks/:id/recommend` | Required | AI priority recommendation   |
| `POST` | `/api/tasks/:id/autotag`   | Required | AI auto-tag from description |

#### GET `/api/search?q=authentication issue`

**Response `200`:**

```json
{
  "results": [
    {
      "_id": "64f...",
      "title": "Fix login bug",
      "status": "todo",
      "priority": "high",
      "score": 0.94
    }
  ]
}
```

---

### HTTP Status Codes Used

| Code  | Meaning                                      |
| ----- | -------------------------------------------- |
| `200` | OK — request succeeded                       |
| `201` | Created — resource was created               |
| `400` | Bad Request — invalid input                  |
| `401` | Unauthorised — missing or invalid token      |
| `403` | Forbidden — authenticated but not allowed    |
| `404` | Not Found — resource does not exist          |
| `409` | Conflict — e.g. duplicate email              |
| `429` | Too Many Requests — rate limit exceeded      |
| `500` | Internal Server Error — something went wrong |

---

## Real-Time Events (Socket.io)

Connect to the server using Socket.io and join a workspace room to receive live updates.

### Connecting and joining a room

```javascript
// Frontend example
const socket = io("http://localhost:3000");

// Join your workspace room after connecting
socket.emit("join-workspace", workspaceId);
```

### Events emitted by the server

| Event             | Payload              | Triggered when                         |
| ----------------- | -------------------- | -------------------------------------- |
| `task:created`    | `Task` object        | A new task is created in the workspace |
| `task:updated`    | `Task` object        | Any task field is changed              |
| `task:deleted`    | `{ taskId: string }` | A task is deleted                      |
| `project:updated` | `Project` object     | A project is renamed or archived       |

### Listening for events (frontend example)

```javascript
socket.on("task:updated", (task) => {
  console.log("Task was updated:", task.title);
  // Update your UI here
});
```

---

## AI Features

### Semantic Search

Instead of keyword matching, search finds tasks by **meaning**. Powered by OpenAI `text-embedding-3-small` and MongoDB Atlas Vector Search.

```bash
GET /api/search?q=authentication is broken
# Returns tasks about login bugs, JWT errors etc — even if those words are not in the query
```

### Task Recommendations

Send a task ID and receive a priority recommendation with reasoning from Claude.

```bash
GET /api/tasks/:id/recommend
```

**Response:**

```json
{
  "suggestedPriority": "critical",
  "reasoning": "This task has a due date in 2 days and blocks user authentication for all users."
}
```

### Auto-Tagging

Send a task and Claude reads the description to suggest category labels.

```bash
POST /api/tasks/:id/autotag
```

**Response:**

```json
{
  "tags": ["bug", "authentication", "backend"]
}
```

---

## Development Roadmap

- [x] Phase 0 — Environment setup, TypeScript config, project scaffold
- [x] Phase 1 — JWT auth, refresh tokens, role-based access middleware
- [ ] Phase 2 — Projects, Tasks, Socket.io real-time, file uploads, activity logs
- [ ] Phase 3 — AI search (Atlas Vector Search), Claude recommendations, auto-tagging
- [ ] Phase 4 — Jest tests, Helmet + rate limiting, Docker, Railway deployment

---

## Scripts

```bash
npm run dev      # Start dev server with hot reload (ts-node-dev)
npm run build    # Compile TypeScript to JavaScript (outputs to /dist)
npm run start    # Run the compiled production build
npm run test     # Run all Jest integration tests
```

---

## Contributing

This is a personal learning project but contributions are welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to GitHub: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT — feel free to use this project however you like.

---
