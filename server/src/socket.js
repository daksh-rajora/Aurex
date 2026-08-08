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

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => io;

/**
 * Emit real-time progress update to a specific analysis room.
 *
 * @param {Object} params - Progress parameters
 * @param {string} params.analysisId - MongoDB Analysis document ID
 * @param {number} params.percentage - Stage percentage (0-100)
 * @param {string} params.stage - Human-readable stage description
 * @param {string} [params.status] - Pipeline status ('Processing' | 'Completed' | 'Failed')
 * @param {string|null} [params.error] - Backend error message if failed
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

    // Emit to room analysis:<analysisId>
    io.to(`analysis:${analysisId}`).emit('analysis_progress', payload);
    // Broadcast fallback event
    io.emit(`analysis:${analysisId}:progress`, payload);

    console.log(`[Socket.IO Progress] [${analysisId}] ${percentage}% - "${stage}" (${status})`);
  }
};

export default {
  initSocket,
  getIO,
  emitAnalysisProgress,
};
