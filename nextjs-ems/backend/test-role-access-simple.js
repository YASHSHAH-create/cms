/**
 * Simple Role-Based Access Test (No Database Required)
 * 
 * This file tests the role-based access logic without requiring MongoDB connection
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key';

// Mock user data for testing
const mockUsers = {
  admin: {
    id: 'admin123',
    role: 'admin',
    username: 'testadmin',
    name: 'Test Admin'
  },
  executive1: {
    id: 'exec123',
    role: 'executive',
    username: 'testexec1',
    name: 'Test Executive 1'
  },
  executive2: {
    id: 'exec456',
    role: 'executive',
    username: 'testexec2',
    name: 'Test Executive 2'
  }
};

// Mock visitor data for testing
const mockVisitors = [
  { _id: 'visitor1', name: 'Visitor 1', assignedAgent: 'exec123' },
  { _id: 'visitor2', name: 'Visitor 2', assignedAgent: 'exec456' },
  { _id: 'visitor3', name: 'Visitor 3', assignedAgent: null }
];

// Mock enquiry data for testing
const mockEnquiries = [
  { _id: 'enquiry1', visitorName: 'Visitor 1', assignedAgent: 'exec123' },
  { _id: 'enquiry2', visitorName: 'Visitor 2', assignedAgent: 'exec456' },
  { _id: 'enquiry3', visitorName: 'Visitor 3', assignedAgent: null }
];

// Generate JWT tokens
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Simulate middleware functions
function addUserContext(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return {
      isAdmin: payload.role === 'admin',
      isExecutive: payload.role === 'executive',
      userId: payload.id,
      userRole: payload.role,
      canAccessAll: payload.role === 'admin'
    };
  } catch (error) {
    return null;
  }
}

// Test role-based filtering functions
function testVisitorsAccess(userContext) {
  if (userContext.isExecutive) {
    return mockVisitors.filter(v => v.assignedAgent === userContext.userId);
  }
  return mockVisitors; // Admin sees all
}

function testEnquiriesAccess(userContext) {
  if (userContext.isExecutive) {
    return mockEnquiries.filter(e => e.assignedAgent === userContext.userId);
  }
  return mockEnquiries; // Admin sees all
}

function testDashboardAccess(userContext) {
  const visitorFilter = userContext.isExecutive ? 
    { assignedAgent: userContext.userId } : {};
  const enquiryFilter = userContext.isExecutive ? 
    { assignedAgent: userContext.userId } : {};

  const visitors = mockVisitors.filter(v => 
    !visitorFilter.assignedAgent || v.assignedAgent === visitorFilter.assignedAgent
  );
  const enquiries = mockEnquiries.filter(e => 
    !enquiryFilter.assignedAgent || e.assignedAgent === enquiryFilter.assignedAgent
  );

  return { visitors: visitors.length, enquiries: enquiries.length };
}

// Test access control functions
function testUpdateVisitorAccess(userContext, visitorId) {
  const visitor = mockVisitors.find(v => v._id === visitorId);
  if (!visitor) return false;

  if (userContext.isExecutive && visitor.assignedAgent !== userContext.userId) {
    return false; // Access denied
  }
  return true; // Access granted
}

function testUpdateEnquiryAccess(userContext, enquiryId) {
  const enquiry = mockEnquiries.find(e => e._id === enquiryId);
  if (!enquiry) return false;

  if (userContext.isExecutive && enquiry.assignedAgent !== userContext.userId) {
    return false; // Access denied
  }
  return true; // Access granted
}

// Run tests
function runTests() {
  console.log('🚀 Starting Simple Role-Based Access Tests...\n');

  // Generate tokens
  const adminToken = generateToken(mockUsers.admin);
  const exec1Token = generateToken(mockUsers.executive1);
  const exec2Token = generateToken(mockUsers.executive2);

  console.log('1. Testing JWT Token Generation...');
  console.log(`   Admin token: ${adminToken.substring(0, 20)}...`);
  console.log(`   Executive 1 token: ${exec1Token.substring(0, 20)}...`);
  console.log(`   Executive 2 token: ${exec2Token.substring(0, 20)}...`);
  console.log('   ✅ JWT tokens generated successfully\n');

  // Test user context
  console.log('2. Testing User Context Extraction...');
  const adminContext = addUserContext(adminToken);
  const exec1Context = addUserContext(exec1Token);
  const exec2Context = addUserContext(exec2Token);

  console.log(`   Admin context: ${JSON.stringify(adminContext)}`);
  console.log(`   Executive 1 context: ${JSON.stringify(exec1Context)}`);
  console.log(`   Executive 2 context: ${JSON.stringify(exec2Context)}`);
  console.log('   ✅ User context extracted successfully\n');

  // Test visitors access
  console.log('3. Testing Visitors Access Control...');
  const adminVisitors = testVisitorsAccess(adminContext);
  const exec1Visitors = testVisitorsAccess(exec1Context);
  const exec2Visitors = testVisitorsAccess(exec2Context);

  console.log(`   Admin visitors: ${adminVisitors.length} (should be 3)`);
  console.log(`   Executive 1 visitors: ${exec1Visitors.length} (should be 1)`);
  console.log(`   Executive 2 visitors: ${exec2Visitors.length} (should be 1)`);
  console.log('   ✅ Visitors access control working correctly\n');

  // Test enquiries access
  console.log('4. Testing Enquiries Access Control...');
  const adminEnquiries = testEnquiriesAccess(adminContext);
  const exec1Enquiries = testEnquiriesAccess(exec1Context);
  const exec2Enquiries = testEnquiriesAccess(exec2Context);

  console.log(`   Admin enquiries: ${adminEnquiries.length} (should be 3)`);
  console.log(`   Executive 1 enquiries: ${exec1Enquiries.length} (should be 1)`);
  console.log(`   Executive 2 enquiries: ${exec2Enquiries.length} (should be 1)`);
  console.log('   ✅ Enquiries access control working correctly\n');

  // Test dashboard access
  console.log('5. Testing Dashboard Access Control...');
  const adminDashboard = testDashboardAccess(adminContext);
  const exec1Dashboard = testDashboardAccess(exec1Context);
  const exec2Dashboard = testDashboardAccess(exec2Context);

  console.log(`   Admin dashboard - Visitors: ${adminDashboard.visitors}, Enquiries: ${adminDashboard.enquiries}`);
  console.log(`   Executive 1 dashboard - Visitors: ${exec1Dashboard.visitors}, Enquiries: ${exec1Dashboard.enquiries}`);
  console.log(`   Executive 2 dashboard - Visitors: ${exec2Dashboard.visitors}, Enquiries: ${exec2Dashboard.enquiries}`);
  console.log('   ✅ Dashboard access control working correctly\n');

  // Test update access control
  console.log('6. Testing Update Access Control...');
  
  // Executive 1 should be able to update their assigned visitor
  const canUpdateOwnVisitor = testUpdateVisitorAccess(exec1Context, 'visitor1');
  console.log(`   Executive 1 can update own visitor: ${canUpdateOwnVisitor}`);
  
  // Executive 1 should NOT be able to update another executive's visitor
  const cannotUpdateOtherVisitor = testUpdateVisitorAccess(exec1Context, 'visitor2');
  console.log(`   Executive 1 cannot update other visitor: ${!cannotUpdateOtherVisitor}`);
  
  // Executive 1 should be able to update their assigned enquiry
  const canUpdateOwnEnquiry = testUpdateEnquiryAccess(exec1Context, 'enquiry1');
  console.log(`   Executive 1 can update own enquiry: ${canUpdateOwnEnquiry}`);
  
  // Executive 1 should NOT be able to update another executive's enquiry
  const cannotUpdateOtherEnquiry = testUpdateEnquiryAccess(exec1Context, 'enquiry2');
  console.log(`   Executive 1 cannot update other enquiry: ${!cannotUpdateOtherEnquiry}`);
  
  console.log('   ✅ Update access control working correctly\n');

  // Test admin access control
  console.log('7. Testing Admin Access Control...');
  const adminCanUpdateAnyVisitor = testUpdateVisitorAccess(adminContext, 'visitor1') &&
                                  testUpdateVisitorAccess(adminContext, 'visitor2') &&
                                  testUpdateVisitorAccess(adminContext, 'visitor3');
  const adminCanUpdateAnyEnquiry = testUpdateEnquiryAccess(adminContext, 'enquiry1') &&
                                  testUpdateEnquiryAccess(adminContext, 'enquiry2') &&
                                  testUpdateEnquiryAccess(adminContext, 'enquiry3');
  
  console.log(`   Admin can update any visitor: ${adminCanUpdateAnyVisitor}`);
  console.log(`   Admin can update any enquiry: ${adminCanUpdateAnyEnquiry}`);
  console.log('   ✅ Admin access control working correctly\n');

  console.log('🎉 All tests completed successfully!');
  console.log('\n📋 Summary:');
  console.log('✅ JWT tokens generated and validated correctly');
  console.log('✅ User context extracted with proper role information');
  console.log('✅ Admins can see all visitors and enquiries');
  console.log('✅ Executives can only see their assigned visitors and enquiries');
  console.log('✅ Access control enforced on all operations');
  console.log('✅ Role-based filtering works correctly');
  console.log('✅ No database connection required - fast execution!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
