# SocietyTrack

**Residential maintenance management — complaints, notices, and overdue tracking in one place.**

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Deployed on Render](https://img.shields.io/badge/API-Render-46E3B7?logo=render&logoColor=black)
![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)

**Live demo:** [https://society-track.vercel.app](https://society-track.vercel.app) · API: [https://society-track-api.onrender.com](https://society-track-api.onrender.com)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Design](#system-design)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [What I'd Add With More Time](#what-id-add-with-more-time)
- [Author](#author)

---

## Overview

Housing societies run maintenance on WhatsApp threads and paper registers — complaints get lost, nobody knows what's been resolved, and residents have no visibility. SocietyTrack replaces that with a structured complaint lifecycle: residents raise issues, admins triage and update status, and both sides get notified in real time.

PostgreSQL was chosen over MongoDB because the data is inherently relational — complaints belong to users, status history belongs to complaints and admins, and the dashboard aggregations (`GROUP BY status`, `GROUP BY category`) are SQL-native operations that would require the aggregation pipeline in Mongo. The schema is fixed and well-defined, so a document store adds no value here.

---

## Features

| Resident | Admin |
|---|---|
| ✅ Register and log in | ✅ Separate admin login (seeded) |
| ✅ Raise complaints with category, description, and optional photo | ✅ Dashboard with totals by status, category, and overdue count |
| ✅ View complaint history and current status | ✅ Weekly complaints bar chart (last 6 weeks) |
| ✅ Real-time status updates via WebSocket | ✅ Filter and search all complaints |
| ✅ Full status change history per complaint | ✅ Update complaint status with state-machine validation |
| ✅ Email notification on every status change | ✅ Assign priority (Low / Medium / High) |
| ✅ Notice board for society announcements | ✅ Manually flag a complaint as overdue |
| | ✅ Post and delete notices, mark as important |
| | ✅ Email all residents on important notices |
| | ✅ Configure the overdue detection threshold (days) |

---

## Tech Stack

| Layer | Technology | Purpose | Why chosen |
|---|---|---|---|
| Frontend | React 19 + Vite 8 | UI framework | Fast HMR, modern JSX transform, ES modules |
| Styling | Tailwind CSS 3 | Utility-first CSS | No context switching; design tokens via CSS vars |
| Animations | Framer Motion | Page and element transitions | Declarative API, minimal bundle cost |
| Charts | Recharts | Admin dashboard bar chart | Built on D3, composable, responsive out of the box |
| HTTP client | Axios | API requests | Interceptor support for JWT injection |
| Real-time | Socket.IO client | Live status updates | Pairs directly with server-side Socket.IO |
| Backend | Node.js + Express 5 | REST API + WebSocket server | Familiar ecosystem, async-first |
| ORM | Prisma 7 | Database access | Type-safe queries, schema migrations, seed support |
| Database | PostgreSQL 16 | Persistent storage | Relational model, ACID, strong aggregate support |
| Auth | JWT + bcryptjs | Stateless authentication | No session store needed; roles encoded in payload |
| File uploads | Multer + Cloudinary | Photo storage | Images never hit the server disk; Cloudinary handles CDN |
| Email | Nodemailer + Gmail | Transactional email | Zero infra cost for low-volume alerts |
| Scheduler | node-cron | Overdue detection | Lightweight in-process cron; no Redis/queue overhead |
| Real-time | Socket.IO | Push updates to complaint rooms | Residents subscribe to a complaint room, get instant updates |
| Linter | oxlint | Frontend linting | 50–100× faster than ESLint |

---

## System Design

### Complaint Status History Model

Every status transition creates a `StatusHistory` record linking the complaint, the admin who made the change, the old and new status, and an optional note. This is an append-only audit trail — the complaint row itself only holds the current state, while history is fully reconstructable from `status_history`. Transitions are validated server-side against a state machine (`OPEN → IN_PROGRESS → RESOLVED`; no backwards transitions). This prevents partial updates and makes the timeline on the complaint detail page trivially accurate.

### Overdue Detection

A `node-cron` job runs every hour. It reads the `overdue_days` value from `app_config` (default 7, configurable by admin at runtime), computes a cutoff timestamp, and runs two `updateMany` queries: one to mark unresolved complaints older than the cutoff as overdue, and one to clear the overdue flag on anything that has since been resolved. This approach keeps the flag always current without requiring a trigger or a separate background worker. Admins can also manually flag a complaint via the API if they want to escalate before the threshold.

### Photo Handling

Photos are streamed directly from the client to Cloudinary via `multer-storage-cloudinary`. The file never lands on the Express server's filesystem — multer pipes the stream straight to Cloudinary's upload API and returns the URL, which is then stored in `complaints.photo_url`. The upload middleware enforces a 5 MB limit and restricts MIME types to `jpg`, `jpeg`, `png`, and `webp` before the stream starts. Images land in a dedicated `SocietyTrack` folder in Cloudinary and are served through Cloudinary's CDN.

### Notification Flow

Two notification paths run in parallel when an admin updates a complaint's status. The first is synchronous-from-the-client's-perspective: Socket.IO emits a `status-updated` event to the `complaint:<id>` room, which the resident's complaint detail page is subscribed to. The resident sees the change without polling. The second is email via Nodemailer — the call is fire-and-forget (`.catch` logs the error, the HTTP response doesn't wait for it), so a slow SMTP server doesn't block the API response. For important notices, the same pattern applies: Nodemailer sends individual emails to all registered residents, errors are logged and swallowed per-recipient so one bad address doesn't abort the rest.

---

## Database Schema

<details>
<summary>View all 5 tables</summary>

```sql
-- Enums
CREATE TYPE "Role"     AS ENUM ('RESIDENT', 'ADMIN');
CREATE TYPE "Category" AS ENUM ('ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER');
CREATE TYPE "Status"   AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- users
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  role       "Role"    NOT NULL DEFAULT 'RESIDENT',
  flat_no    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- complaints
CREATE TABLE complaints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  category    "Category" NOT NULL,
  description TEXT NOT NULL,
  photo_url   TEXT,
  status      "Status"   NOT NULL DEFAULT 'OPEN',
  priority    "Priority",
  is_overdue  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- status_history  (append-only audit log)
CREATE TABLE status_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id),
  changed_by   UUID NOT NULL REFERENCES users(id),
  old_status   "Status" NOT NULL,
  new_status   "Status" NOT NULL,
  note         TEXT,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- notices
CREATE TABLE notices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID NOT NULL REFERENCES users(id),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- app_config  (key-value settings store)
CREATE TABLE app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Seeded row: ('overdue_days', '7')
```

</details>

---

## API Reference

<details>
<summary>View all endpoints</summary>

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/auth/register` | None | Register a new resident |
| `POST` | `/api/auth/login` | None | Login, returns JWT |
| `GET` | `/api/auth/me` | JWT | Get current user profile |
| `POST` | `/api/complaints` | JWT · Resident | Raise a complaint (multipart/form-data with optional `photo`) |
| `GET` | `/api/complaints/my` | JWT · Resident | List own complaints |
| `GET` | `/api/complaints/:id` | JWT | Get single complaint with status history |
| `GET` | `/api/notices` | JWT | List all notices |
| `GET` | `/api/admin/dashboard` | JWT · Admin | Totals by status, category, and overdue count |
| `GET` | `/api/admin/dashboard/weekly` | JWT · Admin | Complaint counts for the last 6 weeks |
| `GET` | `/api/admin/complaints` | JWT · Admin | All complaints (filter by `status`, `category`, `date_from`, `date_to`, `q`) |
| `PATCH` | `/api/admin/complaints/:id/status` | JWT · Admin | Update status with optional note |
| `PATCH` | `/api/admin/complaints/:id/priority` | JWT · Admin | Set priority |
| `PATCH` | `/api/admin/complaints/:id/overdue` | JWT · Admin | Manually flag as overdue |
| `POST` | `/api/admin/notices` | JWT · Admin | Create a notice |
| `DELETE` | `/api/admin/notices/:id` | JWT · Admin | Delete a notice |
| `GET` | `/api/admin/config/overdue-days` | JWT · Admin | Get current overdue threshold |
| `PUT` | `/api/admin/config/overdue-days` | JWT · Admin | Update overdue threshold |

</details>

---

## Local Setup

Prerequisites: Node.js 20+, PostgreSQL 14+, a Cloudinary account, a Gmail account with an App Password enabled.

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/society-maintenance-tracker.git
   cd society-maintenance-tracker
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Configure backend environment**

   ```bash
   cp .env.example .env
   # Fill in all values — see Environment Variables section below
   ```

4. **Run database migrations and seed the admin user**

   ```bash
   npx prisma migrate deploy
   node prisma/seed.js
   ```

   The seed creates:
   - Admin account: `admin@society.com` / `Admin@123`
   - Default config: `overdue_days = 7`

5. **Start the backend**

   ```bash
   npm run dev
   # API listening on http://localhost:5000
   ```

6. **Install frontend dependencies** (new terminal)

   ```bash
   cd ../frontend
   npm install
   ```

7. **Configure frontend environment**

   ```bash
   cp .env.example .env
   # Set VITE_API_URL=http://localhost:5000/api
   ```

8. **Start the frontend**

   ```bash
   npm run dev
   # App running on http://localhost:5173
   ```

---

## Environment Variables

### `backend/.env`

```bash
# PostgreSQL connection string — from Neon, local Postgres, or any PG host
DATABASE_URL=postgresql://user:password@localhost:5432/society_tracker

# Secret used to sign JWTs — any long random string
JWT_SECRET=your_jwt_secret_here

# Cloudinary credentials — from https://console.cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gmail account used as the sender for transactional emails
GMAIL_USER=your_gmail@gmail.com
# App Password generated in Google Account → Security → 2-Step Verification → App passwords
GMAIL_APP_PASSWORD=your_gmail_app_password

# URL of the frontend — used by Socket.IO CORS config
FRONTEND_URL=http://localhost:5173

# Port the Express server listens on
PORT=5000
```

### `frontend/.env`

```bash
# Base URL of the backend API — no trailing slash
VITE_API_URL=http://localhost:5000/api
```

---

## Project Structure

```plaintext
society-maintenance-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # All models, enums, and relations
│   │   ├── seed.js                # Seeds admin user + default config
│   │   └── migrations/            # Auto-generated migration SQL
│   └── src/
│       ├── app.js                 # Express app — middleware, routes, error handler
│       ├── server.js              # HTTP server, Socket.IO init, cron start
│       ├── socket.js              # Socket.IO setup — complaint rooms
│       ├── controllers/
│       │   ├── auth.controller.js             # Register, login, getMe
│       │   ├── complaint.controller.js        # Resident complaint CRUD
│       │   ├── admin.complaint.controller.js  # Admin triage, dashboard, stats
│       │   ├── config.controller.js           # overdue_days read/write
│       │   └── notice.controller.js           # Notice CRUD + email broadcast
│       ├── routes/                # One file per domain, mirrors controllers
│       ├── middleware/
│       │   ├── auth.middleware.js     # JWT verification, role guards
│       │   └── upload.middleware.js   # Multer + Cloudinary stream config
│       └── services/
│           ├── email.service.js       # Nodemailer wrappers (status change + notice)
│           └── overdue.service.js     # node-cron hourly overdue detection job
│
└── frontend/
    └── src/
        ├── App.jsx                    # Route definitions, protected route wrappers
        ├── api/axios.js               # Axios instance with JWT interceptor
        ├── components/
        │   ├── Layout.jsx             # Shared nav shell
        │   ├── ProtectedRoute.jsx     # Auth + role guard wrapper
        │   ├── NoticeCard.jsx         # Reusable notice display card
        │   └── Toast.jsx              # Global toast notification component
        └── pages/
            ├── LandingPage.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── resident/
            │   ├── Dashboard.jsx          # Complaint list + status badges
            │   ├── RaiseComplaint.jsx     # New complaint form with photo upload
            │   ├── ComplaintDetail.jsx    # Timeline view + live socket updates
            │   └── NoticeBoardPage.jsx    # Notice board
            └── admin/
                ├── AdminDashboard.jsx     # Stats cards + weekly bar chart
                ├── AllComplaints.jsx      # Filterable complaint table
                ├── ComplaintManage.jsx    # Status/priority controls + history
                ├── NoticeManage.jsx       # Post and delete notices
                └── ConfigPage.jsx        # Update overdue threshold
```

---

## Deployment

### Frontend → Vercel

Connect the repo to Vercel. Set root directory to `frontend`. Set `VITE_API_URL` to your Render API URL in the Vercel environment variables panel. Vercel runs `npm run build` automatically on every push to `main`.

### Backend → Render

Create a new **Web Service** on Render. Set root directory to `backend`, build command to `npm install`, and start command to `node src/server.js`. Add all backend environment variables in the Render dashboard. Render assigns a public HTTPS URL — use this as `VITE_API_URL` in Vercel.

### Database → Neon

Create a new Neon project and copy the **Session mode** connection string (port 5432) into `DATABASE_URL`. Run `npx prisma migrate deploy` once from your local machine (pointing at the Neon URL) to apply the schema, then run the seed script to create the admin account.

---

## What I'd Add With More Time

- **Refresh tokens** — current JWTs are 7-day-lived; a refresh token flow would let short-lived access tokens revoke without forcing re-login.
- **Push notifications** — replacing the email-only path with web push (via the Push API) for instant mobile alerts without an SMTP dependency.
- **Resident self-service flat management** — residents can currently only update their flat number at registration; an account settings page would fix that.
- **Role-based email batching** — the important notice email currently sends one `sendMail` call per resident in a loop; this should be replaced with BCC batching or a proper queue (BullMQ + Redis) to avoid Gmail rate limits at scale.

---

## Author

**[Your Name]** — [Your College Name]
[GitHub](https://github.com/your-username) · [LinkedIn](https://linkedin.com/in/your-profile)

Built as part of the Unthinkable Solutions fullstack engineering assessment.
