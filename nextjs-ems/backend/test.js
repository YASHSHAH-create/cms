const { connectMongo } = require('./config/mongo');
(async () => {
  try {
    await connectMongo();
    console.log('MongoDB connection test successful at', new Date().toISOString());
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  } finally {
    process.exit();
  }
})();