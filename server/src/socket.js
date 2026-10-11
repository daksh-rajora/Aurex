import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO server attached to Express HTTP server.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join_analysis', (analysisId) => {
      if (analysisId) {
        const room = `analysis:${analysisId}`;
        socket.join(room);
        console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);
      }
    });

    socket.on('leave_analysis', (analysisId) => {
      if (analysisId) {
        const room = `analysis:${analysisId}`;
        socket.leave(room);
        console.log(`[Socket.IO] Client ${socket.id} left room: ${room}`);
      }
    });

    socket.on('join_user', (userId) => {
      if (userId) {
        const room = `user:${userId}`;
        socket.join(room);
        console.log(`[Socket.IO] Client ${socket.id} joined user room: ${room}`);
      }
    });

    socket.on('leave_user', (userId) => {
      if (userId) {
        const room = `user:${userId}`;
        socket.leave(room);
        console.log(`[Socket.IO] Client ${socket.id} left user room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;

/**
 * Emit real-time progress update to a specific analysis room.
 */
export const emitAnalysisProgress = ({ analysisId, percentage, stage, status = 'Processing', error = null }) => {
  if (io && analysisId) {
    const payload = {
      analysisId: String(analysisId),
      percentage,
      stage,
      status,
      error,
      timestamp: new Date().toISOString(),
    };

    io.to(`analysis:${analysisId}`).emit('analysis_progress', payload);
    io.emit(`analysis:${analysisId}:progress`, payload);

    console.log(`[Socket.IO Progress] [${analysisId}] ${percentage}% - "${stage}" (${status})`);
  }
};

/**
 * Emit real-time notification to a specific user.
 *
 * @param {Object} params
 * @param {string|Object} params.userId - Target user ID
 * @param {Object} params.notification - Formatted notification object
 */
export const emitUserNotification = ({ userId, notification }) => {
  if (io && userId) {
    const userRoom = `user:${String(userId)}`;
    io.to(userRoom).emit('notification:new', notification);
    io.emit(`user:${String(userId)}:notification`, notification);

    console.log(`[Socket.IO Notification] Sent to ${userRoom}: ${notification?.title || 'New Notification'}`);
  }
};

export default {
  initSocket,
  getIO,
  emitAnalysisProgress,
  emitUserNotification,
};
