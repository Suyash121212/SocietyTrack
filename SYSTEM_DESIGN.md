# SocietyTrack — System Design


---

## 1. High-Level Architecture

SocietyTrack follows a three-tier architecture — a React SPA, a Node.js/Express API, and a PostgreSQL database (Neon) — plus two infrastructure components that unlock production-grade behaviour: **Redis** (Upstash) for the async email queue and dashboard cache, and **Cloudinary** for photo storage and CDN delivery.

Every request enters the Express server. Authenticated routes are protected by JWT middleware. Write operations enqueue async side-effects (emails) rather than executing them inline. The BullMQ worker runs in the same Node.js process but on a separate event-loop path, so SMTP latency never blocks the HTTP response.

```mermaid
flowchart TB
    A[Browser - React + Vite] -->|HTTP / REST| B[Express API - Render]
    A <-.->|WebSocket - Socket.IO| B
    B --> C[(PostgreSQL - Neon)]
    B --> D[Cloudinary]
    B --> E[(Redis - Upstash)]
    E --> G[BullMQ Worker - same process]
    G --> F[Gmail SMTP via Nodemailer]
    H[node-cron - hourly] -.-> B
    H --> C
    H --> E
```

---

## 2. Complaint Lifecycle & Status History Model

A complaint's current state is a single row in `complaints`. Its full history is a separate, append-only `status_history` table. This separation is deliberate — it keeps the complaint row narrow and fast to query, while the history table grows as an immutable audit log.

Every status transition — whether triggered by an admin action or the system cron — creates one `status_history` row with `complaint_id`, `changed_by` (nullable; `NULL` means system-generated), `old_status`, `new_status`, `note`, and `changed_at`. The entire lifecycle of any complaint can be reconstructed from history alone, without relying on the current row.

**State machine enforcement:** transitions are validated server-side against an explicit map before any DB write, and any transition not in the map is rejected with HTTP 400 — no client-side trust, no ad-hoc if-checks.

```mermaid
stateDiagram-v2
    [*] --> OPEN
    OPEN --> IN_PROGRESS: Admin updates status
    OPEN --> RESOLVED: Admin updates status
    IN_PROGRESS --> RESOLVED: Admin updates status
    RESOLVED --> REOPENED: Resident reopens (within reopen_window_days)
    REOPENED --> IN_PROGRESS: Admin resumes work
    REOPENED --> RESOLVED: Admin resolves again
    RESOLVED --> [*]

    note right of OPEN
        System (cron): SLA breach on any active state
        sets isOverdue=true, priority escalated one level,
        status_history row created with changed_by = NULL
    end note
```

**Reliability:** `status_history` is append-only — nothing is deleted or updated. Combined with `NULL` for system-generated rows, the timeline always gives an honest, complete picture of what happened and who or what caused it.

---

## 3. Overdue Detection & Auto-Escalation

A database trigger fires synchronously on every write and has no access to application-layer config. A cron job instead runs on a schedule, reads config from `app_config`, resolves per-complaint SLA thresholds from `sla_policies`, and batches all writes into a single pass.

**Threshold resolution** falls back through three levels: an exact category + priority match, then a category-level default, then a global default — so every complaint always resolves to *some* threshold even if no specific rule was configured for its combination.

```mermaid
flowchart TD
    A[node-cron fires - hourly] --> B[Load sla_policies + app_config]
    B --> C[Load all active complaints - status NOT IN RESOLVED]
    C --> D[For each complaint - pure JS, no DB calls in loop]
    D --> E[Resolve threshold: exact match to category default to global]
    E --> F{Age exceeds threshold AND not already overdue?}
    F -->|No| G[Skip]
    F -->|Yes| H{Priority already HIGH?}
    H -->|Yes| I[Bucket: overdue-only]
    H -->|No| J[Bucket: overdue + escalate priority]
    I --> K[Batched writes after loop completes]
    J --> K
    K --> L[updateMany: overdue-only IDs]
    K --> M[updateMany: per priority bucket, max 2 buckets]
    K --> N[createMany: status_history audit rows]
    K --> O[updateMany: clear overdue flag on RESOLVED]
    L & M & N & O --> P[Invalidate dashboard cache - Redis DEL]
```

**Scalability note:** the classification loop is pure JS — zero DB round-trips per complaint. For a society with 500 active complaints, the cron still fires a fixed number of queries regardless of how many breach their SLA.

---

## 4. Photo Handling

Render's free tier has an ephemeral filesystem — anything written to disk is lost on restart. Cloudinary solves storage, CDN delivery, and thumbnail generation in one service, so the backend never touches binary image data.

```mermaid
flowchart LR
    A[Resident selects up to 3 photos] --> B[Multer validates MIME type + 5MB limit]
    B -->|Invalid| C[Reject - 400, no DB write]
    B -->|Valid| D[Stream to Cloudinary - no local disk write]
    D --> E[Cloudinary stores original + eager thumbnail transform]
    E --> F[Returns secure_url + thumbnail secure_url]
    F --> G[complaint_photos row: url, thumbnail_url, position]
    G --> H[List views load thumbnail_url]
    G --> I[Detail view loads full-resolution url]
```

**Why store both URLs:** list views need thumbnails (~4 KB each). Fetching the full-resolution URL at list time would be wasteful — storing `thumbnail_url` at upload time means the list query returns display-ready data with no extra API calls or client-side URL manipulation.

**Reliability:** Multer validates MIME type and enforces the 5 MB limit before the upload stream starts. If Cloudinary returns an error, the complaint-create transaction is never called — no orphaned DB rows.

---

## 5. Notification Flow

If Nodemailer were called inline in the controller, the HTTP response would wait for SMTP — Gmail's SMTP can take 200–800 ms. On a notice broadcast to 50 residents, that becomes up to 40 seconds of blocking. The queue decouples API response time from SMTP latency entirely.

```mermaid
sequenceDiagram
    participant AB as Admin Browser
    participant API as Express API
    participant DB as PostgreSQL
    participant Q as Redis - BullMQ
    participant S as Socket.IO
    participant RB as Resident Browser
    participant SMTP as Gmail SMTP

    AB->>API: PATCH /complaints/:id/status
    API->>API: Validate state-machine transition
    API->>DB: UPDATE complaints SET status
    API->>DB: INSERT INTO status_history
    API->>Q: Enqueue email job (non-blocking)
    API->>S: emit('status-updated') to complaint room (non-blocking)
    API-->>AB: HTTP 200 - updated complaint

    Note over API,SMTP: API response already returned — everything below is async

    Q->>Q: Worker dequeues job
    Q->>SMTP: sendMail(...)
    alt success
        SMTP-->>Q: 250 OK, job marked complete
    else failure
        SMTP-->>Q: error
        Q->>Q: retry with backoff (5s, 10s, 20s), max 3 attempts
    end
    S-->>RB: status-updated event, real-time UI update
```

**Important notice broadcast:** each recipient becomes its own BullMQ job. One bad email address fails independently — the other residents still receive their email on the first attempt, avoiding the N+1 pattern of one query and one SMTP call per resident done sequentially.

**Scalability note:** worker concurrency of 1 is appropriate for Gmail's SMTP rate limits. Moving to SendGrid or SES would allow bumping concurrency to 5–10 with no architectural change — just swapping the transport in the email worker.

---

## 6. Performance Optimisations

| Optimisation | Where | Why |
|---|---|---|
| Redis dashboard cache (60s TTL) | Aggregation endpoints | GROUP BY queries are expensive; numbers don't need to be real-time |
| Cache invalidation on mutation | Status/priority/overdue updates, cron | Ensures post-action dashboard loads are always fresh |
| Cursor pagination | Both list endpoints | No COUNT(*) round-trip; stable across inserts |
| Urgency sort in application code | Admin complaints list | Composite score can't be expressed as a simple SQL ORDER BY without a computed column |
| Thumbnail pre-generation (eager) | Cloudinary upload | Thumbnails cached on CDN before any resident requests them |
| Parallel independent reads | Complaint detail, reopen flow | `Promise.all` for DB + config queries instead of sequential |
| Batched cron writes | Overdue service | Fixed query count regardless of how many complaints breach SLA |
| Single transaction per status change | Status update + history insert | Atomic — no partial writes if either query fails |

---

## 7. Database Schema

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : raises
    USERS ||--o{ STATUS_HISTORY : "changes (nullable = system)"
    USERS ||--o{ NOTICES : posts
    COMPLAINTS ||--o{ COMPLAINT_PHOTOS : has
    COMPLAINTS ||--o{ STATUS_HISTORY : tracks

    USERS {
        uuid id PK
        string name
        string email
        string password
        string role
        string flat_no
        timestamp created_at
    }
    COMPLAINTS {
        uuid id PK
        uuid user_id FK
        string category
        string description
        string status
        string priority
        boolean is_overdue
        timestamp created_at
        timestamp resolved_at
    }
    COMPLAINT_PHOTOS {
        uuid id PK
        uuid complaint_id FK
        string url
        string thumbnail_url
        int position
    }
    STATUS_HISTORY {
        uuid id PK
        uuid complaint_id FK
        uuid changed_by FK "nullable, NULL = system"
        string old_status
        string new_status
        string note
        timestamp changed_at
    }
    NOTICES {
        uuid id PK
        uuid admin_id FK
        string title
        string body
        boolean is_important
        timestamp valid_from
        timestamp valid_until
        timestamp created_at
    }
    SLA_POLICIES {
        uuid id PK
        string category "nullable = global default"
        string priority "nullable = category default"
        int threshold_days
    }
    APP_CONFIG {
        string key PK
        string value
    }
```

---

## Appendix — Additional Module Diagrams

Not part of the five core subsystems above, included for completeness.

**Authentication module**
```mermaid
sequenceDiagram
    participant R as Resident/Admin
    participant API as Express API
    participant DB as PostgreSQL

    R->>API: POST /auth/login (email, password)
    API->>DB: Fetch user by email
    DB-->>API: User record + hashed password
    API->>API: bcrypt.compare(password, hash)
    API->>API: Sign JWT (user id, role)
    API-->>R: 200 OK + JWT token
    R->>API: Subsequent requests, Authorization header
    API->>API: Verify JWT + role middleware
```

**Dashboard & reporting module**
```mermaid
flowchart TD
    A[Admin opens dashboard] --> B{Redis cache valid? TTL 60s}
    B -->|Yes| C[Serve cached stats]
    B -->|No| D[Run aggregation queries]
    D --> E[Count by status]
    D --> F[Count by category]
    D --> G[Recurring issue detection]
    D --> H[Avg resolution time]
    E & F & G & H --> I[Cache result in Redis, 60s TTL]
    I --> C
```

