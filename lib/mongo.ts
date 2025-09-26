import mongoose from 'mongoose';

let connectingPromise: Promise<typeof mongoose> | null = null;

/**
 * Connect to Mongo exactly once. Subsequent calls are no-ops.
 * Simplified connection for MongoDB Atlas compatibility.
 */
export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Check environment variables.');
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
    // Use simplified options for serverless environments
    connectingPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second timeout
      maxPoolSize: 1, // Maintain only one connection
      minPoolSize: 0, // Allow connection to close
    });
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
