require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testVisitorsAPI() {
  try {
    console.log('🔐 Testing authentication and visitors API...');
    
    // Step 1: Login as executive to get token
    console.log('\n1️⃣ Logging in as executive...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'executive1@envirocarelabs.com',
        password: 'exec123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // Step 2: Test visitors-management API
    console.log('\n2️⃣ Testing visitors-management API...');
    const visitorsResponse = await fetch(`${API_BASE}/api/analytics/visitors-management?limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!visitorsResponse.ok) {
      throw new Error(`Visitors API failed: ${visitorsResponse.status}`);
    }
    
    const visitorsData = await visitorsResponse.json();
    console.log('✅ Visitors API successful!');
    console.log(`📊 Found ${visitorsData.visitors.length} visitors in API response`);
    console.log(`📊 Pagination: ${visitorsData.pagination.total} total, page ${visitorsData.pagination.page}`);
    
    // Show first few visitors
    console.log('\n📋 First 5 visitors from API:');
    visitorsData.visitors.slice(0, 5).forEach((visitor, index) => {
      console.log(`${index + 1}. ${visitor.name} (${visitor.email}) - ${visitor.service} - ${visitor.status}`);
    });
    
    console.log('\n🎉 API is working correctly with real data!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testVisitorsAPI();
