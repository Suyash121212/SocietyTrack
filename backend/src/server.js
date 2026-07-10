import 'dotenv/config';
import app from './app.js';
import { startOverdueCron } from './services/overdue.service.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  startOverdueCron();
});
