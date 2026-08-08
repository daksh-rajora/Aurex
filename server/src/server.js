import 'dotenv/config';

console.log(
  process.env.OPENROUTER_API_KEY
    ? "✅ OpenRouter API Key Loaded"
    : "❌ OpenRouter API Key Missing"
);
import app from './app.js';
import config from './config/config.js';
import { connectDB } from './config/db.js';
import { verifyResendProvider } from './services/email/providers/resend.provider.js';

import { initSocket } from './socket.js';

// Handle uncaught exception errors globally
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception detected! Shutting down server immediately...');
  console.error(err.name, err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});

let server;

// Start server initialization
const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Verify Resend Email Provider initialization
    verifyResendProvider();

    // 3. Start listening for incoming HTTP requests
    server = app.listen(config.port, () => {
      console.log(`=================================================`);
      console.log(`  Aurex Server is running in [${config.env}] mode`);
      console.log(`  Local Endpoint: http://localhost:${config.port}`);
      console.log(`=================================================`);
    });

    // 4. Initialize Socket.IO real-time server
    initSocket(server);
    console.log('✅ Socket.IO Real-Time Engine Initialized');
  } catch (error) {
    console.error(`Failed to initialize application server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err) => {
  console.error('CRITICAL: Unhandled Promise Rejection detected! Gracefully shutting down...');
  console.error(err.name, err.message);
  if (err.stack) {
    console.error(err.stack);
  }

  if (server) {
    server.close(() => {
      console.log('Server connection closed. Process exited.');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM signal (e.g. from Docker, Kubernetes, PM2 or hosting platforms)
process.on('SIGTERM', () => {
  console.log('System signal SIGTERM received. Gracefully closing active connections...');
  if (server) {
    server.close(() => {
      console.log('HTTP server closed. Exiting process.');
      process.exit(0);
    });
  }
});
