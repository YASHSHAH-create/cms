const { connectMongo } = require('./config/mongo');
const User = require('./models/User');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Connect to MongoDB
    await connectMongo();
    console.log('✅ Connected to MongoDB');
    
    // Test User model
    console.log('\n🔍 Testing User model...');
    const userCount = await User.countDocuments();
    console.log(`✅ Total users in database: ${userCount}`);
    
    // Check for agents (customer executives)
    console.log('\n🔍 Checking for agents (customer executives)...');
    const agents = await User.find({ 
      role: { $in: ['customer-executive', 'customer_executive', 'executive'] }
    }).select('_id name username email role').lean();
    
    console.log(`✅ Found ${agents.length} agents:`);
    agents.forEach(agent => {
      console.log(`- ${agent.name} (${agent.role})`);
    });
    
    // Check for sales executives
    console.log('\n🔍 Checking for sales executives...');
    const salesExecutives = await User.find({ 
      role: 'sales-executive',
      isApproved: true,
      isActive: true
    }).select('_id name username email role isApproved isActive').lean();
    
    console.log(`✅ Found ${salesExecutives.length} sales executives:`);
    salesExecutives.forEach(exec => {
      console.log(`- ${exec.name} (${exec.role}) - Approved: ${exec.isApproved}, Active: ${exec.isActive}`);
    });
    
    // Check all users
    console.log('\n🔍 All users in database:');
    const allUsers = await User.find({}).select('_id name username email role isApproved isActive').lean();
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}) - Approved: ${user.isApproved}, Active: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabaseConnection();
