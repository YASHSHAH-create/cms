const axios = require('axios');
const API_BASE = 'http://localhost:5000';

async function testEndpoints() {
  try {
    console.log('🔍 Testing API endpoints for internal server errors...');
    
    // First, let's test if the server is running
    console.log('\n1. Testing server connectivity...');
    try {
      const response = await axios.get(`${API_BASE}/api/auth/test`);
      console.log('✅ Server is running');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Server is not running. Please start the backend server first.');
        return;
      }
      console.log('⚠️ Server responded with:', error.response?.status);
    }
    
    // Test agents endpoint
    console.log('\n2. Testing /api/auth/agents...');
    try {
      const response = await axios.get(`${API_BASE}/api/auth/agents`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      console.log('✅ Agents endpoint response:', response.data);
    } catch (error) {
      console.log('❌ Agents endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test sales executives endpoint
    console.log('\n3. Testing /api/auth/sales-executives...');
    try {
      const response = await axios.get(`${API_BASE}/api/auth/sales-executives`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      console.log('✅ Sales executives endpoint response:', response.data);
    } catch (error) {
      console.log('❌ Sales executives error:', error.response?.status, error.response?.data);
    }
    
    // Test visitors endpoint
    console.log('\n4. Testing /api/visitors...');
    try {
      const response = await axios.get(`${API_BASE}/api/visitors`, {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      console.log('✅ Visitors endpoint response:', response.data);
    } catch (error) {
      console.log('❌ Visitors error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints();
