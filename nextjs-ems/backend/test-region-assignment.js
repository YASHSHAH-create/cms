/**
 * Test script for region-based sales executive assignment
 * Run with: node test-region-assignment.js
 */

const { connectMongo } = require('./config/mongo');
const User = require('./models/User');
const Visitor = require('./models/Visitor');
const RegionAssignmentService = require('./services/RegionAssignmentService');

async function testRegionAssignment() {
  try {
    console.log('🧪 Starting region assignment test...');
    
    // Connect to MongoDB
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Create test sales executives with different regions
    console.log('\n📝 Creating test sales executives...');
    
    const testExecutives = [
      { username: 'se_north', name: 'Sales Executive North', email: 'se_north@test.com', role: 'executive', region: 'North' },
      { username: 'se_south', name: 'Sales Executive South', email: 'se_south@test.com', role: 'executive', region: 'South' },
      { username: 'se_east', name: 'Sales Executive East', email: 'se_east@test.com', role: 'executive', region: 'East' },
      { username: 'se_west', name: 'Sales Executive West', email: 'se_west@test.com', role: 'executive', region: 'West' }
    ];

    for (const exec of testExecutives) {
      const existing = await User.findOne({ username: exec.username });
      if (!existing) {
        const hashedPassword = await require('bcryptjs').hash('test123', 10);
        await User.create({ ...exec, password: hashedPassword });
        console.log(`✅ Created ${exec.name} for region ${exec.region}`);
      } else {
        // Update existing executive with region
        await User.findByIdAndUpdate(existing._id, { region: exec.region });
        console.log(`✅ Updated ${exec.name} with region ${exec.region}`);
      }
    }

    // Create test visitors with different regions
    console.log('\n📝 Creating test visitors...');
    
    const testVisitors = [
      { name: 'John North', email: 'john.north@test.com', region: 'North', service: 'Water Testing' },
      { name: 'Jane South', email: 'jane.south@test.com', region: 'South', service: 'Food Testing' },
      { name: 'Bob East', email: 'bob.east@test.com', region: 'East', service: 'Environmental Testing' },
      { name: 'Alice West', email: 'alice.west@test.com', region: 'West', service: 'Shelf-Life Study' },
      { name: 'Charlie North', email: 'charlie.north@test.com', region: 'North', service: 'Others' }
    ];

    for (const visitorData of testVisitors) {
      const existing = await Visitor.findOne({ email: visitorData.email });
      if (!existing) {
        await Visitor.create({
          ...visitorData,
          source: 'chatbot',
          status: 'enquiry_required',
          isConverted: false
        });
        console.log(`✅ Created visitor ${visitorData.name} for region ${visitorData.region}`);
      } else {
        // Update existing visitor with region
        await Visitor.findByIdAndUpdate(existing._id, { region: visitorData.region });
        console.log(`✅ Updated visitor ${visitorData.name} with region ${visitorData.region}`);
      }
    }

    // Test region assignment
    console.log('\n🔄 Testing region-based assignment...');
    const result = await RegionAssignmentService.assignSalesExecutivesToUnassignedVisitors();
    console.log(`✅ Assignment result:`, result);

    // Verify assignments
    console.log('\n🔍 Verifying assignments...');
    const visitors = await Visitor.find({ region: { $exists: true, $ne: null } });
    
    for (const visitor of visitors) {
      if (visitor.salesExecutive) {
        const executive = await User.findById(visitor.salesExecutive);
        console.log(`✅ ${visitor.name} (${visitor.region}) → ${executive?.name} (${executive?.region})`);
      } else {
        console.log(`❌ ${visitor.name} (${visitor.region}) → No sales executive assigned`);
      }
    }

    // Test region assignments API
    console.log('\n🔍 Testing region assignments API...');
    const regionAssignments = await RegionAssignmentService.getRegionAssignments();
    console.log('✅ Region assignments:', JSON.stringify(regionAssignments, null, 2));

    // Test getting executives by region
    console.log('\n🔍 Testing get executives by region...');
    const northExecutives = await RegionAssignmentService.getSalesExecutivesByRegion('North');
    console.log('✅ North region executives:', northExecutives.map(e => e.name));

    console.log('\n🎉 Region assignment test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testRegionAssignment();
