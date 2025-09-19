// Test MongoDB connection
process.env.MONGODB_URI = "mongodb+srv://Admin:Admin123@ems-cluster.mdwsv3q.mongodb.net/?retryWrites=true&w=majority&appName=ems-cluster";

const { connectMongo } = require('./config/mongo');
const Visitor = require('./models/Visitor');

async function testConnection() {
  try {
    console.log('🔗 Testing MongoDB connection...');
    await connectMongo();
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a visitor
    console.log('🧪 Testing visitor creation...');
    const testVisitor = new Visitor({
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      source: 'chatbot',
      service: 'Others'
    });
    
    await testVisitor.save();
    console.log('✅ Test visitor created successfully!');
    
    // Clean up test visitor
    await Visitor.deleteOne({ email: 'test@example.com' });
    console.log('🧹 Test visitor cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
