const axios = require('axios');
const jwt = require('jsonwebtoken');
const API_BASE = 'http://localhost:5000';

async function testWithValidToken() {
  try {
    console.log('🔍 Testing with valid JWT token...');
    
    // Create a valid JWT token for testing
    const testUser = {
      userId: 'test-user-id',
      username: 'testuser',
      role: 'admin'
    };
    
    const token = jwt.sign(testUser, process.env.JWT_SECRET || 'your-secret-key-here', { expiresIn: '1h' });
    console.log('✅ Generated test token:', token.substring(0, 50) + '...');
    
    // Test agents endpoint with valid token
    console.log('\n1. Testing /api/auth/agents with valid token...');
    try {
      const response = await axios.get(`${API_BASE}/api/auth/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Agents endpoint response:', response.data);
    } catch (error) {
      console.log('❌ Agents endpoint error:', error.response?.status, error.response?.data);
      if (error.response?.data?.message) {
        console.log('Error message:', error.response.data.message);
      }
    }
    
    // Test sales executives endpoint with valid token
    console.log('\n2. Testing /api/auth/sales-executives with valid token...');
    try {
      const response = await axios.get(`${API_BASE}/api/auth/sales-executives`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Sales executives endpoint response:', response.data);
    } catch (error) {
      console.log('❌ Sales executives error:', error.response?.status, error.response?.data);
      if (error.response?.data?.message) {
        console.log('Error message:', error.response.data.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWithValidToken();
