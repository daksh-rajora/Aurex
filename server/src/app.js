import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config/config.js';
import authRoutes from './routes/auth.routes.js';
import githubRoutes from './routes/github.routes.js';
import aiRoutes from './routes/ai.routes.js';
import analysisRoutes from './modules/analysis/analysis.routes.js';
import publicAnalysisRoutes from './modules/analysis/publicAnalysis.routes.js';
import jobRoutes from './routes/job.routes.js';
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

// Mount authentication routes
app.use('/api/auth', authRoutes);

// Mount GitHub OAuth routes
app.use('/api/github', githubRoutes);

// Mount AI review routes
app.use('/api/ai', aiRoutes);

// Mount Repository Analysis module routes
app.use('/api/analysis', analysisRoutes);

// Mount Public Repository Analysis route
app.use('/api/public-analysis', publicAnalysisRoutes);


// Mount Background Job routes
app.use('/api/jobs', jobRoutes);

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
    errors: err.errors || [],
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

export default app;
