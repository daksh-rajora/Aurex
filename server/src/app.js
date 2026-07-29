import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/config.js';
import apiRouter from './routes/index.js';

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Cookie parsing middleware
app.use(cookieParser());

// Body parsing middlewares with payload size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount main API routes
app.use('/api', apiRouter);

// Fallback 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${statusCode} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

export default app;
