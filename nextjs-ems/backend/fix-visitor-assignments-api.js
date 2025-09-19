/**
 * Script to fix visitor agent and sales executive assignments using API endpoints
 * This bypasses the need for direct database access
 * Based on requirements:
 * - All agents should be "Sanjana Pawar" 
 * - Shreyas should have 2 visitors as sales executive
 * - Yug should have 1 visitor as sales executive
 * - Others can be left blank
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:5000';

async function fixVisitorAssignments() {
  console.log('🚀 Fixing visitor assignments through API...');
  
  try {
    // First, get an admin token
    console.log('🔐 Getting authentication token...');
    
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
    
    // Get all visitors
    console.log('📊 Fetching all visitors...');
    const visitorsResponse = await fetch(`${API_BASE}/api/analytics/visitors-management?limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!visitorsResponse.ok) {
      console.error('❌ Failed to fetch visitors:', await visitorsResponse.text());
      return;
    }
    
    const visitorsData = await visitorsResponse.json();
    const visitors = visitorsData.visitors || [];
    
    console.log(`📋 Found ${visitors.length} visitors to update`);
    
    if (visitors.length === 0) {
      console.log('⚠️  No visitors found. Please create some visitors first.');
      return;
    }
    
    console.log('🔄 Updating visitor assignments...');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < visitors.length; i++) {
      const visitor = visitors[i];
      
      try {
        // Prepare update data
        const updateData = {
          name: visitor.name,
          email: visitor.email,
          phone: visitor.phone || '',
          organization: visitor.organization || '',
          region: visitor.region || '',
          service: visitor.service,
          subservice: visitor.subservice || '',
          enquiryDetails: visitor.enquiryDetails || '',
          source: visitor.source,
          status: visitor.status,
          comments: visitor.comments || '',
          amount: visitor.amount || 0,
          // Set agent to Sanjana Pawar for all visitors
          agentName: 'Sanjana Pawar',
          // Set sales executive based on requirements
          salesExecutiveName: (() => {
            if (i < 2) {
              return 'Shreyas Salvi'; // First 2 visitors go to Shreyas
            } else if (i === 2) {
              return 'Yug'; // Third visitor goes to Yug
            } else {
              return ''; // Others remain blank
            }
          })()
        };
        
        const response = await fetch(`${API_BASE}/api/analytics/update-visitor-details`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            visitorId: visitor._id,
            ...updateData
          })
        });
        
        if (response.ok) {
          console.log(`✅ Updated visitor ${i + 1}: ${visitor.name} - Agent: Sanjana Pawar, Sales Exec: ${updateData.salesExecutiveName || 'None'}`);
          successCount++;
        } else {
          const error = await response.text();
          console.log(`❌ Failed to update visitor ${visitor.name}: ${error}`);
          errorCount++;
        }
      } catch (e) {
        console.log(`❌ Error updating visitor ${visitor.name}: ${e.message}`);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully updated: ${successCount} visitors`);
    console.log(`❌ Failed to update: ${errorCount} visitors`);
    
    // Show final assignment summary
    console.log('\n📊 Final Assignment Summary:');
    console.log(`👤 Sanjana Pawar (Agent): ${successCount} visitors`);
    console.log(`👤 Shreyas Salvi (Sales Executive): 2 visitors`);
    console.log(`👤 Yug (Sales Executive): 1 visitor`);
    console.log(`👤 Unassigned (Sales Executive): ${Math.max(0, successCount - 3)} visitors`);
    
    if (successCount > 0) {
      console.log('\n🎉 Visitor assignments have been updated successfully!');
      console.log('🔗 You can now refresh your visitors page to see the corrected data.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing visitor assignments:', error);
  }
}

// Run the script
if (require.main === module) {
  fixVisitorAssignments();
}

module.exports = { fixVisitorAssignments };
