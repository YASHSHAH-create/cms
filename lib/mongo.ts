import mongoose from 'mongoose';
import { getConfig, dbConfig } from './config';

let connectingPromise: Promise<typeof mongoose> | null = null;

/**
 * Connect to Mongo exactly once. Subsequent calls are no-ops.
 * Enhanced connection with comprehensive error handling and fallbacks.
 */
export async function connectMongo() {
  const config = getConfig();
  const uri = config.mongodbUri;
  
  if (!uri || uri === 'mongodb://localhost:27017/ems') {
    console.warn('⚠️ MONGODB_URI not configured, using fallback mode');
    throw new Error('MongoDB connection not available - using fallback mode');
  }

  // Only log on first connection attempt
  if (mongoose.connection.readyState === 0) {
    console.log('Attempting MongoDB connection...');
    console.log('Connection string format:', uri.split('@')[0] + '@[HIDDEN]');
  }

  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }
  if (connectingPromise) {
    console.log('MongoDB connection already in progress...');
    return connectingPromise;
  }

  try {
    // Use optimized options for serverless environments
    connectingPromise = mongoose.connect(uri, dbConfig.options);
    await connectingPromise;
    console.log('✅ MongoDB connected successfully at', new Date().toISOString());
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    return mongoose.connection;
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    // Detailed error analysis
    if (error.name === 'MongoServerSelectionError') {
      console.error('🔍 This usually means:');
      console.error('   - Network connectivity issues');
      console.error('   - MongoDB Atlas cluster is down');
      console.error('   - IP address not whitelisted in MongoDB Atlas');
      console.error('   - Incorrect connection string format');
    } else if (error.name === 'MongoParseError') {
      console.error('🔍 This usually means:');
      console.error('   - Malformed connection string');
      console.error('   - Missing or incorrect parameters');
    } else if (error.message.includes('bad auth')) {
      console.error('🔍 Authentication failed - possible causes:');
      console.error('   - Incorrect username/password');
      console.error('   - User does not exist in database');
      console.error('   - User lacks required permissions');
      console.error('   - Special characters in password need URL encoding');
      console.error('   - Missing authSource parameter');
    }
    
    // Reset connecting promise on error
    connectingPromise = null;
    throw error;
  }
}

// Handle connection events (only add listeners once)
if (mongoose.connection.listenerCount('error') === 0) {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
}

if (mongoose.connection.listenerCount('disconnected') === 0) {
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    connectingPromise = null;
  });
}

if (mongoose.connection.listenerCount('reconnected') === 0) {
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });
}
