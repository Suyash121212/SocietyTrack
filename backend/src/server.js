import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);

  // Start overdue cron job after server is ready
  // import('./services/overdue.service.js').then(({ startOverdueCron }) => startOverdueCron());
  // Uncomment above once overdue.service.js is implemented (Task 10)
});
