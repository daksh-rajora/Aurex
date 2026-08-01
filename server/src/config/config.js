import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/aurex',
  frontendUrl: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
};

// Validate critical variables in production
if (config.env === 'production' && !process.env.MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in production environment.');
  process.exit(1);
}

export default config;
