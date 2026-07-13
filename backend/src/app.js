import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import authRouter from './routes/auth.routes.js';
import complaintRouter from './routes/complaint.routes.js';
import adminRouter from './routes/admin.complaint.routes.js';
import noticeRouter from './routes/notice.routes.js';
import configRouter from './routes/config.routes.js';

const app = express();

// ─── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Rate limiting ────────────────────────────────────────────────────────────
//
// Three tiers, applied at the route level so legitimate traffic isn't
// penalised unnecessarily:
//
//  1. Auth limiter     — strictest. Prevents brute-force on login/register.
//                        5 attempts per IP per 15 minutes.
//
//  2. Mutation limiter — moderate. Applies to write operations (create complaint,
//                        update status/priority, post notice). 30 requests per
//                        IP per minute covers normal usage while blocking scripts.
//
//  3. General limiter  — broad catch-all on all /api/* routes.
//                        200 requests per IP per minute. High enough that
//                        real users never see it, low enough to stop scraping.
//
// standardHeaders: true  → sends RFC 6585 RateLimit-* headers the client can read.
// legacyHeaders: false    → omits the old X-RateLimit-* headers (redundant noise).

const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            5,
  message:        { error: 'Too many attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders:   false,
  // Skip rate limiting in test environments
  skip: () => process.env.NODE_ENV === 'test',
});

const mutationLimiter = rateLimit({
  windowMs:       60 * 1000, // 1 minute
  max:            30,
  message:        { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: () => process.env.NODE_ENV === 'test',
});

const generalLimiter = rateLimit({
  windowMs:       60 * 1000, // 1 minute
  max:            200,
  message:        { error: 'Too many requests. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders:   false,
  skip: () => process.env.NODE_ENV === 'test',
});

// Apply general limiter to all API routes
app.use('/api', generalLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Auth — strict limiter on login and register only
app.use('/api/auth', authLimiter, authRouter);

// Resident complaint writes — mutation limiter on POST (create) only
// GET routes inherit the general limiter applied above
app.post('/api/complaints',            mutationLimiter);
app.patch('/api/complaints/:id/reopen', mutationLimiter);
app.use('/api/complaints', complaintRouter);

// Admin routes — mutation limiter on writes
app.patch('/api/admin/complaints/:id/status',   mutationLimiter);
app.patch('/api/admin/complaints/:id/priority',  mutationLimiter);
app.patch('/api/admin/complaints/:id/overdue',   mutationLimiter);
app.post('/api/admin/notices',                   mutationLimiter);
app.delete('/api/admin/notices/:id',             mutationLimiter);
app.put('/api/admin/config/overdue-days',        mutationLimiter);
app.put('/api/admin/config/reopen-days',         mutationLimiter);
app.put('/api/admin/config/sla',                 mutationLimiter);
app.use('/api/admin', adminRouter);
app.use('/api/admin', configRouter);

// Notices
app.use('/api', noticeRouter);

// ─── Central error handler — must be LAST ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ErrorHandler]', err);

  if (err.message?.includes('File too large')) {
    return res.status(400).json({ error: 'Photo must be 5 MB or smaller' });
  }

  if (err.message?.includes('Only jpg')) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

export default app;
