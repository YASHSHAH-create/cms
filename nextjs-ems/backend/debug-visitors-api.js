require('dotenv').config();
const { connectMongo } = require('./config/mongo');
const Visitor = require('./models/Visitor');
const jwt = require('jsonwebtoken');

async function debugVisitorsAPI() {
  try {
    await connectMongo();
    
    // Decode the token to get the userId
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGI1ODMzODExM2E2MGNmNTQ4YTU3NzIiLCJ1c2VybmFtZSI6ImV4ZWN1dGl2ZTEiLCJyb2xlIjoiZXhlY3V0aXZlIiwiaWF0IjoxNzU3Mzk2ODcwLCJleHAiOjE3NTc0ODMyNzB9.mIlfTITRhxfLqEeMwGY1MP_XS8y6YPIcvkZnMNX8tBM";
    const decoded = jwt.decode(token);
    
    console.log('🔍 Debugging Visitors API Logic...');
    console.log('=' .repeat(60));
    console.log('📝 Decoded Token:', decoded);
    console.log('👤 User ID from token:', decoded.userId);
    console.log('👤 User Role:', decoded.role);
    
    const userId = decoded.userId;
    
    // Check if this executive is assigned as an agent to any visitors
    const assignedAsAgent = await Visitor.find({
      assignedAgent: userId
    }).select('_id name email');
    
    console.log('\n🔍 Checking assignedAsAgent query...');
    console.log(`Query: { assignedAgent: "${userId}" }`);
    console.log(`Result: ${assignedAsAgent.length} visitors found`);
    
    if (assignedAsAgent.length > 0) {
      console.log('✅ Executive is assigned as agent to visitors:');
      assignedAsAgent.forEach((visitor, index) => {
        console.log(`${index + 1}. ${visitor.name} (${visitor.email})`);
      });
    } else {
      console.log('❌ No visitors found with this assignedAgent');
    }
    
    // Check all visitors with assigned agents to see the format
    const allAssignedVisitors = await Visitor.find({
      assignedAgent: { $exists: true, $ne: null }
    }).select('_id name email assignedAgent').limit(5);
    
    console.log('\n🔍 Sample visitors with assigned agents:');
    allAssignedVisitors.forEach((visitor, index) => {
      console.log(`${index + 1}. ${visitor.name} - assignedAgent: "${visitor.assignedAgent}"`);
    });
    
    // Check if the userId matches any assignedAgent
    const matchingVisitors = await Visitor.find({
      assignedAgent: userId
    }).select('_id name email assignedAgent');
    
    console.log('\n🎯 Direct match test:');
    console.log(`Looking for assignedAgent: "${userId}"`);
    console.log(`Found ${matchingVisitors.length} matching visitors`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

debugVisitorsAPI();
