import mongoose from 'mongoose';

/**
 * Establishes connection to MongoDB database
 */
let isConnecting = false;

export const connectDB = async () => {
  // Prevent application from repeatedly creating uncontrolled MongoDB connections
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting || mongoose.connection.readyState === 2) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    const errorMsg = 'MongoDB connection error: MONGODB_URI/MONGO_URI environment variable is missing.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    isConnecting = true;

    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  } finally {
    isConnecting = false;
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});
