/**
 * Test script to verify visitor update functionality
 * This tests if region and sales executive fields are properly saved
 */

const { connectMongo } = require('./config/mongo');
const Visitor = require('./models/Visitor');

async function testVisitorUpdate() {
  try {
    console.log('🧪 Testing visitor update functionality...');
    
    // Connect to MongoDB
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Find a visitor to test with
    const testVisitor = await Visitor.findOne({});
    
    if (!testVisitor) {
      console.log('❌ No visitors found in database. Please create a visitor first.');
      return;
    }

    console.log('📝 Found test visitor:', {
      id: testVisitor._id,
      name: testVisitor.name,
      email: testVisitor.email,
      currentRegion: testVisitor.region,
      currentSalesExecutiveName: testVisitor.salesExecutiveName
    });

    // Test data
    const testRegion = 'Test Region ' + Date.now();
    const testSalesExecutiveName = 'Test Sales Executive ' + Date.now();

    console.log('🔄 Updating visitor with test data...');
    console.log('📝 New region:', testRegion);
    console.log('📝 New sales executive name:', testSalesExecutiveName);

    // Update the visitor
    const updatedVisitor = await Visitor.findByIdAndUpdate(
      testVisitor._id,
      {
        region: testRegion,
        salesExecutiveName: testSalesExecutiveName
      },
      { new: true, runValidators: true }
    );

    if (!updatedVisitor) {
      console.log('❌ Failed to update visitor');
      return;
    }

    console.log('✅ Visitor updated successfully');
    console.log('📝 Updated region:', updatedVisitor.region);
    console.log('📝 Updated sales executive name:', updatedVisitor.salesExecutiveName);

    // Verify the update
    if (updatedVisitor.region === testRegion && updatedVisitor.salesExecutiveName === testSalesExecutiveName) {
      console.log('🎉 Test PASSED: Region and sales executive fields updated correctly');
    } else {
      console.log('❌ Test FAILED: Fields were not updated correctly');
      console.log('Expected region:', testRegion, 'Got:', updatedVisitor.region);
      console.log('Expected sales executive name:', testSalesExecutiveName, 'Got:', updatedVisitor.salesExecutiveName);
    }

    // Clean up - restore original values
    console.log('🧹 Cleaning up test data...');
    await Visitor.findByIdAndUpdate(
      testVisitor._id,
      {
        region: testVisitor.region,
        salesExecutiveName: testVisitor.salesExecutiveName
      },
      { new: true }
    );
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testVisitorUpdate();
