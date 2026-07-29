import app from './app.js';
import config from './config/config.js';
import { connectDB } from './config/db.js';

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

    // 2. Start listening for incoming HTTP requests
    server = app.listen(config.port, () => {
      console.log(`=================================================`);
      console.log(`  Aurex Server is running in [${config.env}] mode`);
      console.log(`  Local Endpoint: http://localhost:${config.port}`);
      console.log(`=================================================`);
    });
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
