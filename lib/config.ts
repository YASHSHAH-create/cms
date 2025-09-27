// Comprehensive configuration for local and production environments

export interface AppConfig {
  apiBase: string;
  mongodbUri: string;
  jwtSecret: string;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isNetlify: boolean;
}

// Get configuration based on environment
export function getConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  const isNetlify = process.env.NETLIFY === 'true' || process.env.VERCEL === 'true';

  // API Base URL
  let apiBase = process.env.NEXT_PUBLIC_API_BASE;
  if (!apiBase) {
    if (typeof window !== 'undefined') {
      apiBase = window.location.origin;
    } else {
      apiBase = isNetlify ? 'https://your-app.netlify.app' : 'http://localhost:3000';
    }
  }

  // MongoDB URI
  const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ems';

  // JWT Secret
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here';

  return {
    apiBase,
    mongodbUri,
    jwtSecret,
    nodeEnv,
    isProduction,
    isDevelopment,
    isNetlify
  };
}

// Database connection configuration
export const dbConfig = {
  // MongoDB connection options optimized for serverless
  options: {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
    socketTimeoutMS: 45000, // 45 second timeout
    maxPoolSize: 1, // Maintain only one connection
    minPoolSize: 0, // Allow connection to close
    bufferCommands: false, // Disable mongoose buffering
  },
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  }
};

// API configuration
export const apiConfig = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000,
  
  // Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Error handling configuration
export const errorConfig = {
  // Show detailed errors in development
  showDetailedErrors: process.env.NODE_ENV === 'development',
  
  // Log errors to console
  logErrors: true,
  
  // Fallback data when APIs fail
  useFallbackData: true,
  
  // Retry failed requests
  retryFailedRequests: true,
  maxRetries: 3
};

// Feature flags
export const features = {
  // Enable/disable features based on environment
  enableAnalytics: true,
  enableChat: true,
  enableEnquiries: true,
  enableUserManagement: true,
  
  // Development features
  enableDebugLogs: process.env.NODE_ENV === 'development',
  enableMockData: process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI,
  
  // Production features
  enableCaching: process.env.NODE_ENV === 'production',
  enableCompression: process.env.NODE_ENV === 'production',
};

// Logging configuration
export const logging = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  
  // Log formats
  formats: {
    timestamp: 'YYYY-MM-DD HH:mm:ss',
    level: 'info',
    message: 'message'
  }
};

export default getConfig;
