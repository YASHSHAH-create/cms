require('dotenv').config();
const { connectMongo } = require('./config/mongo');
const ExecutiveService = require('./models/ExecutiveService');
const Visitor = require('./models/Visitor');

async function checkExecutiveAssignments() {
  try {
    await connectMongo();
    
    const executiveId = '68b58338113a60cf548a5772'; // executive1 ID
    
    console.log('🔍 Checking assignments for Executive 1...');
    console.log('=' .repeat(60));
    
    // Check service assignments
    const serviceAssignments = await ExecutiveService.find({
      executiveId: executiveId,
      isActive: true
    }).lean();
    
    console.log('📋 Service Assignments:');
    if (serviceAssignments.length > 0) {
      serviceAssignments.forEach((assignment, index) => {
        console.log(`${index + 1}. ${assignment.serviceName}`);
      });
    } else {
      console.log('❌ No service assignments found');
    }
    
    // Check visitor assignments
    const visitorAssignments = await Visitor.find({
      assignedAgent: executiveId
    }).lean();
    
    console.log('\n👥 Visitor Assignments:');
    if (visitorAssignments.length > 0) {
      visitorAssignments.forEach((visitor, index) => {
        console.log(`${index + 1}. ${visitor.name} (${visitor.email}) - ${visitor.service}`);
      });
    } else {
      console.log('❌ No visitor assignments found');
    }
    
    // Check all visitors with assigned agents
    const allAssignedVisitors = await Visitor.find({
      assignedAgent: { $exists: true, $ne: null }
    }).lean();
    
    console.log('\n🔍 All visitors with assigned agents:');
    if (allAssignedVisitors.length > 0) {
      allAssignedVisitors.forEach((visitor, index) => {
        console.log(`${index + 1}. ${visitor.name} (${visitor.email}) - Agent: ${visitor.assignedAgent}`);
      });
    } else {
      console.log('❌ No visitors have assigned agents');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkExecutiveAssignments();
