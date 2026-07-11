import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { initSocket } from './socket.js';
import { startOverdueCron } from './services/overdue.service.js';

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
  startOverdueCron();
});
