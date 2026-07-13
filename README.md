# SocietyTrack

**Residential maintenance management — complaints, notices, SLA tracking, and reporting in one place.**

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?logo=redis&logoColor=white)
![Render](https://img.shields.io/badge/API-Render-46E3B7?logo=render&logoColor=black)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)

**Live demo:** [https://society-track.vercel.app](https://society-track.vercel.app)  
**API:** [https://society-track-api.onrender.com](https://society-track-api.onrender.com)

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Local Setup](#local-setup)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [System Design](#system-design)
9. [Project Structure](#project-structure)
10. [Deployment](#deployment)
11. [Author](#author)

---

## Overview

Housing societies manage maintenance through WhatsApp threads and paper registers — complaints get lost, residents have no visibility, and nothing is accountable. SocietyTrack replaces that with a structured complaint lifecycle backed by a relational database, SLA enforcement, and real-time updates.

**Why PostgreSQL over MongoDB:** The data is inherently relational — complaints belong to users, status history belongs to complaints and admins, and dashboard aggregations (`GROUP BY status`, `GROUP BY category`, `DATE_TRUNC` weekly charts) are SQL-native operations. The schema is fixed and well-defined, so a document store adds no value.

---

## Features

### Resident

| Feature | Detail |
|---|---|
| Register & login | JWT-based auth with flat number |
| Raise complaints | Category picker, description, up to 3 photos |
| Photo upload | Streamed directly to Cloudinary — never touches the server disk |
| Track complaints | Paginated list with status/category filter and sort |
| Real-time updates | Socket.IO pushes status changes without polling |
| Complaint detail | Full status timeline with actor and notes |
| Reopen complaints | Within configurable window (default 3 days) after resolution |
| Notice board | View society announcements, auto-hidden after expiry |
| Computed metrics | `timeInStatus` and `resolutionTime` shown per complaint |

### Admin

| Feature | Detail |
|---|---|
| Dashboard | Stat cards, weekly trend chart, avg resolution time |
| Recurring issues | Flats with ≥ 2 complaints of same category in 60 days |
| Resolution by category | Avg hours to resolve, per category |
| Complaint queue | Cursor-paginated, filterable, sorted by urgency score |
| Urgency scoring | Composite score: overdue flag + priority + age + status |
| Status management | State machine: OPEN → IN_PROGRESS → RESOLVED, RESOLVED → REOPENED → IN_PROGRESS |
| Auto-escalation | Cron bumps priority one level and inserts a `System` audit row on SLA breach |
| Priority & overdue | Manual override available; cron also handles automatically |
| SLA policy matrix | Per category × priority threshold (e.g. HIGH Electrical = 1 day) |
| Notice management | Post, delete, mark important, set expiry |
| Settings | Overdue threshold, reopen window, full SLA matrix editor |
| Redis cache | Dashboard aggregations cached 60 s, invalidated on any mutation |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React + Vite | 19 / 8 | UI framework |
| Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| Animations | Framer Motion | 12 | Page/element transitions |
| Charts | Recharts | 3 | Dashboard analytics |
| HTTP client | Axios | 1.18 | API requests + JWT interceptor |
| Real-time | Socket.IO client | 4.8 | Live complaint updates |
| Backend | Node.js + Express | 22 / 5 | REST API + WebSocket server |
| ORM | Prisma | 7.8 | Type-safe queries, migrations, seed |
| Database | PostgreSQL (Neon) | 16 | Relational data, aggregations |
| Queue | BullMQ + IORedis | 5.8 / 5.6 | Async email job queue |
| Redis | Upstash | — | Queue broker + dashboard cache |
| Auth | JWT + bcryptjs | — | Stateless auth, roles in payload |
| File upload | Multer + Cloudinary | — | Multi-photo upload, CDN delivery |
| Email | Nodemailer + Gmail | 9 | Transactional notifications |
| Scheduler | node-cron | 4.6 | Hourly SLA detection |
| Rate limiting | express-rate-limit | 7.5 | Brute-force & abuse protection |
| Linter | oxlint | — | Frontend lint (50–100× faster than ESLint) |

---

## Local Setup

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) project (or any PostgreSQL 14+)
- A [Cloudinary](https://cloudinary.com) account
- A [Gmail](https://gmail.com) account with App Password enabled
- An [Upstash](https://upstash.com) Redis database

### 1 — Clone

```bash
git clone https://github.com/Suyash121212/society-maintenance-tracker.git
cd society-maintenance-tracker
```

### 2 — Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in all values — see Environment Variables section
```

### 3 — Run migrations and seed

```bash
npx prisma migrate deploy
node prisma/seed.js
```

Seed creates:
- **Admin account:** `admin@society.com` / `Admin@123`
- **Config defaults:** `overdue_days = 7`, `reopen_window_days = 3`
- **SLA policy matrix:** 20 rows across all category × priority combinations

### 4 — Start backend

```bash
npm run dev
# API + worker running on http://localhost:5000
```

### 5 — Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
```

### 6 — Start frontend

```bash
npm run dev
# http://localhost:5173
```

---

## Environment Variables

### `backend/.env`

```bash
# ── Database ────────────────────────────────────────────────────────────
# Neon pooled connection string (or any PostgreSQL host)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# ── Auth ────────────────────────────────────────────────────────────────
# Any long random string — used to sign JWTs
JWT_SECRET=your_jwt_secret_here

# ── Cloudinary ──────────────────────────────────────────────────────────
# From https://console.cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ── Email (Nodemailer via Gmail) ─────────────────────────────────────────
# The Gmail address used as the sender
GMAIL_USER=your_gmail@gmail.com
# App Password: Google Account → Security → 2-Step Verification → App passwords
GMAIL_APP_PASSWORD=your_gmail_app_password

# ── Redis (BullMQ queue + dashboard cache) ───────────────────────────────
# Upstash URL — note the double-s (rediss://) for TLS
REDIS_URL=rediss://default:YOUR_TOKEN@YOUR_HOST.upstash.io:6379

# ── Server ──────────────────────────────────────────────────────────────
# URL of the frontend — used by Socket.IO CORS config
FRONTEND_URL=http://localhost:5173
PORT=5000
```

### `frontend/.env`

```bash
# Base URL of the backend API — no trailing slash
VITE_API_URL=http://localhost:5000/api
```

---

## Database Schema

<details>
<summary>View all 7 tables</summary>

```sql
-- ── Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "Role"     AS ENUM ('RESIDENT', 'ADMIN');
CREATE TYPE "Category" AS ENUM ('ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER');
CREATE TYPE "Status"   AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REOPENED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- ── users ────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL UNIQUE,
  password   TEXT        NOT NULL,
  role       "Role"      NOT NULL DEFAULT 'RESIDENT',
  flat_no    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── complaints ───────────────────────────────────────────────────────────
CREATE TABLE complaints (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id),
  category    "Category"  NOT NULL,
  description TEXT        NOT NULL,
  status      "Status"    NOT NULL DEFAULT 'OPEN',
  priority    "Priority",
  is_overdue  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ── complaint_photos ─────────────────────────────────────────────────────
-- Normalized: up to 3 photos per complaint.
-- thumbnail_url is pre-generated at upload time via Cloudinary eager transform.
CREATE TABLE complaint_photos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id  UUID        NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  url           TEXT        NOT NULL,  -- full-resolution Cloudinary URL
  thumbnail_url TEXT        NOT NULL,  -- c_thumb,w_200 variant
  position      INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── status_history ───────────────────────────────────────────────────────
-- Append-only audit log. changed_by = NULL means system auto-escalation.
CREATE TABLE status_history (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID        NOT NULL REFERENCES complaints(id),
  changed_by   UUID        REFERENCES users(id),  -- nullable for system rows
  old_status   "Status"    NOT NULL,
  new_status   "Status"    NOT NULL,
  note         TEXT,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── notices ──────────────────────────────────────────────────────────────
-- valid_until = NULL means never expires.
-- Notices past valid_until are filtered out by the API automatically.
CREATE TABLE notices (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID        NOT NULL REFERENCES users(id),
  title        TEXT        NOT NULL,
  body         TEXT        NOT NULL,
  is_important BOOLEAN     NOT NULL DEFAULT FALSE,
  valid_until  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── app_config ───────────────────────────────────────────────────────────
-- Key-value store for runtime-configurable settings.
-- Seeded rows: overdue_days='7', reopen_window_days='3'
CREATE TABLE app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ── sla_policies ─────────────────────────────────────────────────────────
-- category + priority (nullable) → threshold_days.
-- Lookup order: exact match → category default (priority=NULL) → global overdue_days.
CREATE TABLE sla_policies (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category       "Category"  NOT NULL,
  priority       "Priority",
  threshold_days INTEGER     NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, priority)
);
```

</details>

---

## API Reference

### Rate Limits

| Tier | Applies to | Limit |
|---|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/register` | 5 req / 15 min per IP |
| Mutation | All write endpoints (POST, PATCH, PUT, DELETE) | 30 req / min per IP |
| General | All `/api/*` | 200 req / min per IP |

All limited responses return HTTP `429` with a `Retry-After` header.

---

<details>
<summary>View all endpoints</summary>

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/auth/register` | None | Register resident, returns user |
| `POST` | `/api/auth/login` | None | Login, returns JWT + user |
| `GET` | `/api/auth/me` | JWT | Get current user profile |

### Resident — Complaints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/complaints` | JWT · Resident | Create complaint (`multipart/form-data`, field `photos[]`, max 3) |
| `GET` | `/api/complaints/my` | JWT · Resident | Paginated list (`?limit=20&cursor=`) with `canReopen`, `timeInStatus`, `resolutionTime` |
| `GET` | `/api/complaints/:id` | JWT | Single complaint with photos, status history, computed metrics |
| `PATCH` | `/api/complaints/:id/reopen` | JWT · Resident | Reopen within `reopen_window_days`; body `{ note? }` |

### Resident — Notices

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/notices` | JWT | All active notices (expired ones filtered automatically) |

### Admin — Dashboard

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | JWT · Admin | Overview counts, avg resolution, status breakdown |
| `GET` | `/api/admin/dashboard/weekly` | JWT · Admin | Complaints + avg resolution per week (last 6 weeks) |
| `GET` | `/api/admin/dashboard/recurring` | JWT · Admin | Flats with ≥ 2 same-category complaints in 60 days |
| `GET` | `/api/admin/dashboard/resolution-by-category` | JWT · Admin | Avg resolution hours per category |

### Admin — Complaints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/complaints` | JWT · Admin | Cursor-paginated list with urgency score; filters: `status`, `category`, `date_from`, `date_to`, `q` |
| `PATCH` | `/api/admin/complaints/:id/status` | JWT · Admin | Transition status (state machine validated); body `{ status, note? }` |
| `PATCH` | `/api/admin/complaints/:id/priority` | JWT · Admin | Set priority `{ priority: LOW\|MEDIUM\|HIGH }` |
| `PATCH` | `/api/admin/complaints/:id/overdue` | JWT · Admin | Manually flag as overdue |

### Admin — Notices

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/notices` | JWT · Admin | Create notice `{ title, body, isImportant?, validUntil? }` |
| `DELETE` | `/api/admin/notices/:id` | JWT · Admin | Delete notice |

### Admin — Config

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/config/overdue-days` | JWT · Admin | Get global overdue threshold |
| `PUT` | `/api/admin/config/overdue-days` | JWT · Admin | Update global overdue threshold `{ value: number }` |
| `GET` | `/api/admin/config/reopen-days` | JWT · Admin | Get reopen window |
| `PUT` | `/api/admin/config/reopen-days` | JWT · Admin | Update reopen window `{ value: number }` |
| `GET` | `/api/admin/config/sla` | JWT · Admin | Full SLA policy matrix |
| `PUT` | `/api/admin/config/sla` | JWT · Admin | Upsert a policy `{ category, priority?, thresholdDays }` |

</details>

---

## System Design

For the full engineering writeup covering complaint history model, SLA detection, photo handling, notification flow, performance optimisations, and all four architecture diagrams, see **[SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)**.

Transitions are enforced server-side via an explicit map — no if-checks:

```
OPEN → IN_PROGRESS | RESOLVED
IN_PROGRESS → RESOLVED
RESOLVED → REOPENED          (resident only, within reopen_window_days)
REOPENED → IN_PROGRESS | RESOLVED
```

Every transition appends to `status_history`. `changed_by = NULL` marks system-generated rows (auto-escalation). The timeline on the complaint detail page reconstructs the full audit trail from this append-only table.

### SLA & Auto-Escalation

An hourly `node-cron` job resolves each active complaint's threshold from the `sla_policies` table (exact category+priority → category default → global `overdue_days`). On breach it:

1. Sets `is_overdue = true`
2. Bumps priority one level (`LOW → MEDIUM → HIGH`, stops at `HIGH`)
3. Inserts a `StatusHistory` row with `changed_by = NULL` and a descriptive note

All writes are batched — `updateMany` per priority bucket + `createMany` for all audit rows — so the cron fires a fixed number of queries regardless of how many complaints breach their SLA simultaneously.

### Urgency Score (admin queue)

```
score = isOverdue×40 + isReopened×20 + priority(HIGH=15/MEDIUM=8/LOW=3) + status(OPEN=5/IN_PROGRESS=2) + min(ageDays, 20)
```

Computed in JS per page after the DB fetch. Highest-urgency complaints surface first within each cursor page.

### Photo Handling

`multer-storage-cloudinary` pipes file streams directly to Cloudinary with an `eager` transform (`c_thumb,w_200,h_200`). The thumbnail URL is stored alongside the full URL in `complaint_photos` at upload time — no second API call ever needed to serve thumbnails in list views.

### Email Queue (BullMQ)

Controllers call `enqueueStatusChange()` / `enqueueImportantNotice()` — both are fire-and-forget enqueues into a BullMQ queue backed by Upstash Redis. A `Worker` (same process) processes jobs asynchronously with 3-attempt exponential backoff (5s → 10s → 20s). API response time is fully decoupled from SMTP latency.

### Redis Cache

All four dashboard read endpoints cache their results in Redis for 60 seconds. Any mutation that changes complaint counts (status update, priority change, overdue flag, cron run) calls `invalidateDashboardCache()`, which DELs all four keys immediately. The next dashboard load after any admin action always reflects current data.

### Cursor Pagination

Both list endpoints (`GET /api/complaints/my`, `GET /api/admin/complaints`) use cursor-based pagination on `(createdAt DESC, id DESC)`. The cursor is `base64url(ISO timestamp|UUID)` — a compound key so ties on `createdAt` never skip rows. `take: limit + 1` detects `hasMore` without a separate `COUNT(*)` round-trip.

---

## Project Structure

```plaintext
society-maintenance-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # All models, enums, relations
│   │   ├── seed.js                    # Admin user + config + SLA matrix
│   │   └── migrations/                # Auto-generated SQL
│   └── src/
│       ├── app.js                     # Express app — middleware, rate limits, routes
│       ├── server.js                  # HTTP server, Socket.IO, cron, email worker
│       ├── socket.js                  # Socket.IO — complaint rooms
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── complaint.controller.js      # Resident CRUD + reopen
│       │   ├── admin.complaint.controller.js # Admin triage, dashboard, urgency score
│       │   ├── config.controller.js         # overdue_days, reopen_window_days, SLA
│       │   └── notice.controller.js         # Notice CRUD + email broadcast
│       ├── routes/                    # One file per domain
│       ├── middleware/
│       │   ├── auth.middleware.js     # JWT verify, role guards
│       │   └── upload.middleware.js   # Multer + Cloudinary eager thumbnails
│       ├── services/
│       │   ├── cache.js               # Redis GET/SET/invalidate helpers
│       │   ├── email.service.js       # Enqueue wrappers (public interface)
│       │   └── overdue.service.js     # Hourly SLA cron — batched writes
│       ├── queues/
│       │   ├── redis.js               # IORedis connection factory (TLS-aware)
│       │   └── email.queue.js         # BullMQ Queue + enqueue helpers
│       ├── workers/
│       │   └── email.worker.js        # BullMQ Worker — Nodemailer SMTP
│       └── db/
│           └── prisma.js              # PrismaClient singleton
│
└── frontend/
    └── src/
        ├── App.jsx                    # Routes + ProtectedRoute wrappers
        ├── api/axios.js               # Axios instance — JWT interceptor + 401 redirect
        ├── context/AuthContext.jsx    # JWT state, login/logout, isAdmin()
        ├── components/
        │   ├── Layout.jsx             # Dark sidebar + mobile drawer
        │   ├── ProtectedRoute.jsx     # Auth + role guard
        │   ├── StatusBadge.jsx        # OPEN/IN_PROGRESS/RESOLVED/REOPENED
        │   ├── PriorityBadge.jsx      # LOW/MEDIUM/HIGH
        │   ├── StatusTimeline.jsx     # Append-only audit timeline
        │   ├── FilterBar.jsx          # Status/category/date filters
        │   ├── NoticeCard.jsx         # Notice with expiry + delete confirm
        │   ├── PostNoticeForm.jsx     # Title/body/expiry/important form
        │   └── Toast.jsx              # Animated bottom-right notification
        └── pages/
            ├── LandingPage.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── admin/
            │   ├── AdminDashboard.jsx   # Stats, charts, recurring issues
            │   ├── AllComplaints.jsx    # Urgency-sorted paginated table
            │   ├── ComplaintManage.jsx  # Status/priority controls + timeline
            │   ├── NoticeManage.jsx     # Post and manage notices
            │   └── ConfigPage.jsx      # Thresholds + SLA matrix editor
            └── resident/
                ├── Dashboard.jsx        # Paginated complaint list
                ├── RaiseComplaint.jsx   # Multi-photo complaint form
                ├── ComplaintDetail.jsx  # Live updates + reopen + metrics
                └── NoticeBoardPage.jsx  # Notice board
```

---

## Deployment

### Frontend → Vercel

1. Connect the repo to Vercel, set root directory to `frontend`
2. Add environment variable: `VITE_API_URL=https://your-render-api.onrender.com/api`
3. Vercel runs `npm run build` automatically on every push to `main`

### Backend → Render

1. New **Web Service**, root directory `backend`
2. Build command: `npm install`
3. Start command: `node src/server.js`
4. Add all backend environment variables in the Render dashboard

### Database → Neon

1. Create a Neon project, copy the **pooled connection string** into `DATABASE_URL`
2. Run `npx prisma migrate deploy` from your local machine (pointing at Neon)
3. Run `node prisma/seed.js` to create the admin account and seed defaults

### Redis → Upstash

1. Create a free database at [console.upstash.com](https://console.upstash.com)
2. Copy the Redis URL (starts with `rediss://`) into `REDIS_URL`
3. The `redis.js` connection factory auto-enables TLS when it detects the `rediss://` scheme

---

## Author

**Suyash Kakade** — Vishwakarma Institute of Information Technology  
[GitHub](https://github.com/Suyash121212) · [LinkedIn](https://linkedin.com/in/suyash-kakade)


