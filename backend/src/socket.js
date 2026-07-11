import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join-complaint', (complaintId) => {
      socket.join(`complaint:${complaintId}`);
    });

    socket.on('leave-complaint', (complaintId) => {
      socket.leave(`complaint:${complaintId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
};
