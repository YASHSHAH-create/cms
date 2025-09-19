/**
 * Script to create sample enquiries using the API endpoints
 * This bypasses the need for direct database access
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

// Sample enquiries data
const sampleEnquiries = [
  {
    visitorName: 'John Smith',
    phoneNumber: '+1-555-0123',
    email: 'john.smith@example.com',
    enquiryType: 'chatbot',
    enquiryDetails: 'Interested in solar panel installation for a 2000 sq ft home. Looking for cost estimates and installation timeline.'
  },
  {
    visitorName: 'Maria Garcia',
    phoneNumber: '+1-555-0124',
    email: 'maria.garcia@greentech.com',
    enquiryType: 'email',
    enquiryDetails: 'Corporate inquiry about bulk installation of energy-efficient lighting systems for our office building. Need quote for 500+ LED fixtures.'
  },
  {
    visitorName: 'David Johnson',
    phoneNumber: '+1-555-0125',
    email: 'david.johnson@email.com',
    enquiryType: 'website',
    enquiryDetails: 'Looking for information about wind energy solutions for rural property. Have 50 acres available and want to explore feasibility.'
  },
  {
    visitorName: 'Sarah Chen',
    phoneNumber: '+1-555-0126',
    email: 'sarah.chen@startup.io',
    enquiryType: 'calls',
    enquiryDetails: 'Startup company looking for green energy consulting services. Need help with sustainability strategy and carbon footprint reduction.'
  },
  {
    visitorName: 'Michael Brown',
    phoneNumber: '+1-555-0127',
    email: 'michael.brown@manufacturing.com',
    enquiryType: 'email',
    enquiryDetails: 'Manufacturing facility wants to switch to renewable energy. Currently spending $50k/month on electricity. Looking for ROI analysis.'
  },
  {
    visitorName: 'Lisa Wang',
    phoneNumber: '+1-555-0128',
    email: 'lisa.wang@school.edu',
    enquiryType: 'chatbot',
    enquiryDetails: 'School district interested in educational solar program. Want to install solar panels on 10 school buildings for educational purposes.'
  },
  {
    visitorName: 'Robert Taylor',
    phoneNumber: '+1-555-0129',
    email: 'robert.taylor@hotel.com',
    enquiryType: 'website',
    enquiryDetails: 'Hotel chain looking to implement comprehensive energy management system across 15 locations. Focus on cost reduction and sustainability.'
  },
  {
    visitorName: 'Emma Wilson',
    phoneNumber: '+1-555-0130',
    email: 'emma.wilson@nonprofit.org',
    enquiryType: 'calls',
    enquiryDetails: 'Non-profit organization seeking pro-bono or discounted renewable energy consultation for community center project.'
  }
];

async function createSampleEnquiries() {
  console.log('🚀 Creating sample enquiries through API...');
  
  try {
    // First, try to get an admin token by creating/logging in a user
    console.log('🔐 Getting authentication token...');
    
    // Try to login with default admin credentials
    let token = null;
    
    try {
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        token = loginData.token;
        console.log('✅ Logged in with existing admin account');
      }
    } catch (e) {
      console.log('ℹ️  Admin login failed, will try to create admin account...');
    }
    
    // If login failed, try to create admin account
    if (!token) {
      try {
        const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'admin',
            email: 'admin@envirocare.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'admin'
          })
        });
        
        if (registerResponse.ok) {
          const registerData = await registerResponse.json();
          token = registerData.token;
          console.log('✅ Created and logged in with new admin account');
        }
      } catch (e) {
        console.error('❌ Failed to create admin account:', e.message);
      }
    }
    
    if (!token) {
      console.error('❌ Could not get authentication token. Make sure the backend server is running on http://localhost:5000');
      return;
    }
    
    console.log('📝 Creating sample enquiries...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const enquiry of sampleEnquiries) {
      try {
        const response = await fetch(`${API_BASE}/api/analytics/add-enquiry`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(enquiry)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Created enquiry for ${enquiry.visitorName}`);
          successCount++;
        } else {
          const error = await response.text();
          console.log(`❌ Failed to create enquiry for ${enquiry.visitorName}: ${error}`);
          errorCount++;
        }
      } catch (e) {
        console.log(`❌ Error creating enquiry for ${enquiry.visitorName}: ${e.message}`);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully created: ${successCount} enquiries`);
    console.log(`❌ Failed to create: ${errorCount} enquiries`);
    
    if (successCount > 0) {
      console.log('\n🎉 Sample enquiries have been created!');
      console.log('🔗 You can now refresh your enquiries page to see the data.');
    }
    
  } catch (error) {
    console.error('❌ Error creating sample enquiries:', error);
  }
}

// Run the script
if (require.main === module) {
  createSampleEnquiries();
}

module.exports = { createSampleEnquiries };
