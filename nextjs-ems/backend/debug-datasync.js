require('dotenv').config();
const { connectMongo } = require('./config/mongo');
const DataSyncService = require('./services/DataSyncService');
const Visitor = require('./models/Visitor');
const Enquiry = require('./models/Enquiry');
const ChatMessage = require('./models/ChatMessage');

async function debugDataSync() {
  try {
    console.log('🔍 Debugging DataSyncService...');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');
    
    // Check raw data
    const totalVisitors = await Visitor.countDocuments({});
    const totalEnquiries = await Enquiry.countDocuments({});
    const totalMessages = await ChatMessage.countDocuments({});
    
    console.log(`📊 Raw data counts:`);
    console.log(`  - Visitors: ${totalVisitors}`);
    console.log(`  - Enquiries: ${totalEnquiries}`);
    console.log(`  - Chat Messages: ${totalMessages}`);
    
    // Test DataSyncService
    console.log('\n🔄 Testing DataSyncService.getUnifiedDashboardData...');
    try {
      const unifiedData = await DataSyncService.getUnifiedDashboardData('admin', null);
      console.log('✅ DataSyncService successful!');
      console.log(`📊 Unified data:`);
      console.log(`  - Visitors: ${unifiedData.visitors.length}`);
      console.log(`  - Enquiries: ${unifiedData.enquiries.length}`);
      console.log(`  - Chat History: ${unifiedData.chatHistory.length}`);
      
      if (unifiedData.visitors.length > 0) {
        console.log(`📋 First visitor: ${unifiedData.visitors[0].name} (${unifiedData.visitors[0].email})`);
      }
    } catch (syncError) {
      console.error('❌ DataSyncService failed:', syncError.message);
      console.error('❌ Error details:', syncError);
    }
    
    // Test dashboard stats
    console.log('\n🔄 Testing DataSyncService.getDashboardStats...');
    try {
      const stats = await DataSyncService.getDashboardStats('admin', null);
      console.log('✅ Dashboard stats successful!');
      console.log(`📊 Stats:`, stats);
    } catch (statsError) {
      console.error('❌ Dashboard stats failed:', statsError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    process.exit(0);
  }
}

debugDataSync();
