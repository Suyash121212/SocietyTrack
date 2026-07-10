import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// TODO: Mount routers here as they are implemented
// app.use('/api/auth', authRouter);
// app.use('/api/complaints', complaintRouter);
// app.use('/api/admin', adminRouter);
// app.use('/api/notices', noticeRouter);

// Central error handler — must be LAST
app.use((err, _req, res, _next) => {
  console.error('[ErrorHandler]', err);

  // Multer file-too-large
  if (err.message?.includes('File too large')) {
    return res.status(400).json({ error: 'Photo must be 5 MB or smaller' });
  }

  // Multer mime-type rejection
  if (err.message?.includes('Only jpg')) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

export default app;
