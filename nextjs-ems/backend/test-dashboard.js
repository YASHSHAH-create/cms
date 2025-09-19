require('dotenv').config();
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testDashboard() {
  try {
    console.log('🔐 Testing dashboard functionality...');
    
    // Step 1: Login as admin
    console.log('\n1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, got token');
    
    // Step 2: Test dashboard API
    console.log('\n2️⃣ Testing dashboard API...');
    const dashboardResponse = await fetch(`${API_BASE}/api/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard API failed: ${dashboardResponse.status}`);
    }
    
    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard API successful!');
    console.log(`📊 Dashboard stats:`, dashboardData.stats);
    console.log(`📊 Visitors count: ${dashboardData.unifiedData?.visitors?.length || 0}`);
    console.log(`📊 Enquiries count: ${dashboardData.unifiedData?.enquiries?.length || 0}`);
    console.log(`📊 Chat history count: ${dashboardData.unifiedData?.chatHistory?.length || 0}`);
    
    // Step 3: Test visitors management API
    console.log('\n3️⃣ Testing visitors management API...');
    const visitorsResponse = await fetch(`${API_BASE}/api/analytics/visitors-management`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!visitorsResponse.ok) {
      throw new Error(`Visitors API failed: ${visitorsResponse.status}`);
    }
    
    const visitorsData = await visitorsResponse.json();
    console.log('✅ Visitors management API successful!');
    console.log(`📊 Found ${visitorsData.visitors.length} visitors`);
    
    console.log('\n🎉 All dashboard functionality is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDashboard();
