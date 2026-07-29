import mongoose from 'mongoose';
import config from './config.js';

/**
 * Establishes connection to MongoDB database
 */
export const connectDB = async () => {
  try {
    // Enable Mongoose query debugging in development
    if (config.env === 'development') {
      mongoose.set('debug', true);
    }

    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error; // Propagate error to let server.js handle it
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost! Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB background connection error: ${err.message}`);
});
