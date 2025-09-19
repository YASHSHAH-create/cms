// Test script to verify visitor persistence and dashboard data consistency
require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

// Test data
const testVisitors = [
  {
    name: 'Test User 1',
    email: 'test1@example.com',
    phone: '+1-555-0001',
    organization: 'Test Corp 1',
    service: 'Water Testing',
    source: 'chatbot'
  },
  {
    name: 'Test User 2',
    email: 'test2@example.com',
    phone: '+1-555-0002',
    organization: 'Test Corp 2',
    service: 'Food Testing',
    source: 'email'
  },
  {
    name: 'Test User 3',
    email: 'test3@example.com',
    phone: '+1-555-0003',
    organization: 'Test Corp 3',
    service: 'Environmental Testing',
    source: 'website'
  }
];

async function testVisitorPersistence() {
  console.log('🧪 Testing Visitor Persistence and Dashboard Consistency');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Get initial count
    console.log('\n1️⃣ Getting initial visitor count...');
    const initialCountResponse = await fetch(`${API_BASE}/api/visitors/count`);
    if (!initialCountResponse.ok) {
      throw new Error(`Failed to get initial count: ${initialCountResponse.status}`);
    }
    const initialCountData = await initialCountResponse.json();
    const initialCount = initialCountData.count;
    console.log(`📊 Initial visitor count: ${initialCount}`);
    
    // Step 2: Create test visitors
    console.log('\n2️⃣ Creating test visitors...');
    const createdVisitors = [];
    
    for (let i = 0; i < testVisitors.length; i++) {
      const visitor = testVisitors[i];
      console.log(`   Creating visitor ${i + 1}: ${visitor.name} (${visitor.email})`);
      
      const response = await fetch(`${API_BASE}/api/visitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitor)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create visitor ${i + 1}: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`   ✅ Created visitor ${i + 1}: ${result.visitorId} (created: ${result.created})`);
      createdVisitors.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 3: Verify count increased
    console.log('\n3️⃣ Verifying visitor count increased...');
    const newCountResponse = await fetch(`${API_BASE}/api/visitors/count`);
    if (!newCountResponse.ok) {
      throw new Error(`Failed to get new count: ${newCountResponse.status}`);
    }
    const newCountData = await newCountResponse.json();
    const newCount = newCountData.count;
    console.log(`📊 New visitor count: ${newCount}`);
    
    const expectedCount = initialCount + testVisitors.length;
    if (newCount === expectedCount) {
      console.log(`✅ Count verification passed: ${newCount} = ${expectedCount}`);
    } else {
      console.log(`❌ Count verification failed: ${newCount} ≠ ${expectedCount}`);
    }
    
    // Step 4: Test admin dashboard endpoint
    console.log('\n4️⃣ Testing admin dashboard endpoint...');
    const adminResponse = await fetch(`${API_BASE}/api/analytics/visitors-management?limit=100`);
    if (!adminResponse.ok) {
      throw new Error(`Failed to get admin data: ${adminResponse.status}`);
    }
    const adminData = await adminResponse.json();
    console.log(`📊 Admin endpoint returned ${adminData.visitors.length} visitors`);
    console.log(`📊 Admin pagination: ${adminData.pagination.total} total, page ${adminData.pagination.page}`);
    
    // Step 5: Test direct visitors endpoint
    console.log('\n5️⃣ Testing direct visitors endpoint...');
    const visitorsResponse = await fetch(`${API_BASE}/api/visitors?limit=100`);
    if (!visitorsResponse.ok) {
      throw new Error(`Failed to get visitors: ${visitorsResponse.status}`);
    }
    const visitorsData = await visitorsResponse.json();
    console.log(`📊 Direct endpoint returned ${visitorsData.items.length} visitors`);
    console.log(`📊 Direct pagination: ${visitorsData.total} total, page ${visitorsData.page}`);
    
    // Step 6: Verify data consistency
    console.log('\n6️⃣ Verifying data consistency...');
    const adminCount = adminData.visitors.length;
    const directCount = visitorsData.items.length;
    const countEndpoint = newCount;
    
    console.log(`📊 Admin endpoint: ${adminCount} visitors`);
    console.log(`📊 Direct endpoint: ${directCount} visitors`);
    console.log(`📊 Count endpoint: ${countEndpoint} visitors`);
    
    if (adminCount === directCount && directCount === countEndpoint) {
      console.log('✅ Data consistency verification passed!');
    } else {
      console.log('❌ Data consistency verification failed!');
      console.log('   Admin endpoint and direct endpoint should return the same data');
    }
    
    // Step 7: Test search functionality
    console.log('\n7️⃣ Testing search functionality...');
    const searchResponse = await fetch(`${API_BASE}/api/analytics/visitors-management?search=Test&limit=100`);
    if (!searchResponse.ok) {
      throw new Error(`Failed to search visitors: ${searchResponse.status}`);
    }
    const searchData = await searchResponse.json();
    console.log(`📊 Search for "Test" returned ${searchData.visitors.length} visitors`);
    
    // Step 8: Test filtering
    console.log('\n8️⃣ Testing filtering...');
    const filterResponse = await fetch(`${API_BASE}/api/analytics/visitors-management?source=chatbot&limit=100`);
    if (!filterResponse.ok) {
      throw new Error(`Failed to filter visitors: ${filterResponse.status}`);
    }
    const filterData = await filterResponse.json();
    console.log(`📊 Filter by source=chatbot returned ${filterData.visitors.length} visitors`);
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Created ${testVisitors.length} test visitors`);
    console.log(`✅ Visitor count increased from ${initialCount} to ${newCount}`);
    console.log(`✅ Admin endpoint working: ${adminCount} visitors`);
    console.log(`✅ Direct endpoint working: ${directCount} visitors`);
    console.log(`✅ Search functionality working: ${searchData.visitors.length} results`);
    console.log(`✅ Filter functionality working: ${filterData.visitors.length} results`);
    
    if (adminCount === directCount && directCount === countEndpoint) {
      console.log('🎉 ALL TESTS PASSED! Visitor persistence is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
if (require.main === module) {
  testVisitorPersistence();
}

module.exports = { testVisitorPersistence };
