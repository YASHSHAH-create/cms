// backend/config/database.js
// MongoDB-based database configuration using Mongoose
// Replaces SQLite implementation with MongoDB integration

const { connectMongo } = require('./mongo');
const bcrypt = require('bcryptjs');

// Import existing Mongoose models
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const ChatMessage = require('../models/ChatMessage');
const Faq = require('../models/Faq');
const Article = require('../models/Article');

// Track initialization state
let isInitialized = false;
let initializationPromise = null;

/**
 * Initialize MongoDB connection and seed default data
 * This function ensures the database is ready for use
 */
const initializeDatabase = async () => {
  if (isInitialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🔄 Initializing MongoDB database...');
      
      // Connect to MongoDB using mongo.js
      await connectMongo();
      
      // Seed default users if they don't exist
      await seedDefaultUsers();
      
      isInitialized = true;
      console.log('✅ Database initialization completed successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      initializationPromise = null; // Reset so it can be retried
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Seed default users (admin and executives) if they don't already exist
 * Uses bcrypt to hash passwords securely
 */
const seedDefaultUsers = async () => {
  try {
    console.log('🌱 Checking for default users...');
    
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@ems.com',
        password: 'admin123',
        role: 'admin',
        name: 'System Administrator'
      },
      {
        username: 'executive1',
        email: 'executive1@ems.com',
        password: 'exec123',
        role: 'executive',
        name: 'Customer Experience Executive 1'
      },
      {
        username: 'executive2',
        email: 'executive2@ems.com',
        password: 'exec123',
        role: 'executive',
        name: 'Customer Experience Executive 2'
      }
    ];

    let usersCreated = 0;
    
    for (const userData of defaultUsers) {
      // Check if user already exists by username or email
      const existingUser = await User.findOne({
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });

      if (!existingUser) {
        // Create new user (password will be hashed by pre-save hook in User model)
        const newUser = new User(userData);
        await newUser.save();
        usersCreated++;
        console.log(`✅ Created default user: ${userData.username} (${userData.role})`);
      } else {
        console.log(`ℹ️  User already exists: ${userData.username}`);
      }
    }

    if (usersCreated > 0) {
      console.log(`🎉 Successfully created ${usersCreated} default users`);
    } else {
      console.log('ℹ️  All default users already exist');
    }
  } catch (error) {
    console.error('❌ Error seeding default users:', error);
    throw error;
  }
};

/**
 * Get database models object
 * Ensures database is initialized before returning models
 * @returns {Object} Object containing all Mongoose models
 */
const getDb = async () => {
  // Ensure database is initialized
  await initializeDatabase();
  
  // Return object with all models for easy access
  return {
    users: User,
    visitors: Visitor,
    chatMessages: ChatMessage,
    faqs: Faq,
    articles: Article,
    
    // Also provide direct model access for backward compatibility
    User,
    Visitor,
    ChatMessage,
    Faq,
    Article
  };
};

/**
 * Synchronous version of getDb for backward compatibility
 * Note: This should be used carefully as it doesn't ensure initialization
 * @returns {Object} Object containing all Mongoose models
 */
const getDbSync = () => {
  if (!isInitialized) {
    console.warn('⚠️  Database not initialized. Call getDb() first or ensure initialization.');
  }
  
  return {
    users: User,
    visitors: Visitor,
    chatMessages: ChatMessage,
    faqs: Faq,
    articles: Article,
    
    // Also provide direct model access for backward compatibility
    User,
    Visitor,
    ChatMessage,
    Faq,
    Article
  };
};

/**
 * Check if database is initialized
 * @returns {boolean} True if database is ready for use
 */
const isDbInitialized = () => isInitialized;

/**
 * Reset initialization state (useful for testing)
 */
const resetInitialization = () => {
  isInitialized = false;
  initializationPromise = null;
};

// Initialize database when module is loaded
// This ensures the database is ready when the application starts
if (process.env.MONGODB_URI) {
  initializeDatabase().catch((error) => {
    console.error('Failed to initialize database on module load:', error);
    // Don't exit the process, let the application handle the error
  });
} else {
  console.warn('⚠️  MONGODB_URI not found. Database initialization skipped.');
}

// Export functions and models
module.exports = {
  getDb,           // Async version - recommended for new code
  getDbSync,       // Sync version - for backward compatibility
  initializeDatabase,
  isDbInitialized,
  resetInitialization,
  
  // Direct model exports for convenience
  User,
  Visitor,
  ChatMessage,
  Faq,
  Article
};

// For backward compatibility, also export getDb as the default export
module.exports.default = getDb;