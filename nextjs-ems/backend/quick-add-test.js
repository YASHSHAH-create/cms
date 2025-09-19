const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function quickAddTest() {
  try {
    console.log('🔍 Quick test of add-enquiry endpoint...');
    
    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const { token } = await loginRes.json();
    console.log('✅ Login successful');
    
    // Test add-enquiry with unique data
    const testData = {
      visitorName: 'Network Test User',
      email: `networktest${Date.now()}@example.com`,
      enquiryType: 'calls',
      enquiryDetails: 'Testing from network tab debugging'
    };
    
    console.log('📝 Sending data:', testData);
    
    const response = await fetch('http://localhost:5000/api/analytics/add-enquiry', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
    } else {
      console.log('❌ ERROR!');
    }
    
  } catch (e) {
    console.log('❌ EXCEPTION:', e.message);
  }
}

quickAddTest();
