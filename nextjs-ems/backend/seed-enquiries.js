/**
 * Script to seed sample enquiries into the database
 * Run with: node seed-enquiries.js
 */

const { connectMongo } = require('./config/mongo');
const Enquiry = require('./models/Enquiry');
const User = require('./models/User');
const Visitor = require('./models/Visitor');

const sampleEnquiries = [
  {
    visitorName: 'John Smith',
    phoneNumber: '+1-555-0123',
    email: 'john.smith@example.com',
    enquiryType: 'chatbot',
    enquiryDetails: 'Interested in solar panel installation for a 2000 sq ft home. Looking for cost estimates and installation timeline.',
    status: 'new',
    priority: 'medium',
    organization: 'Smith Family Residence',
    location: 'San Francisco, CA',
    estimatedValue: 15000,
    expectedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    visitorName: 'Maria Garcia',
    phoneNumber: '+1-555-0124',
    email: 'maria.garcia@greentech.com',
    enquiryType: 'email',
    enquiryDetails: 'Corporate inquiry about bulk installation of energy-efficient lighting systems for our office building. Need quote for 500+ LED fixtures.',
    status: 'in_progress',
    priority: 'high',
    organization: 'GreenTech Solutions Inc.',
    location: 'Los Angeles, CA',
    estimatedValue: 45000,
    expectedCompletionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
  },
  {
    visitorName: 'David Johnson',
    phoneNumber: '+1-555-0125',
    email: 'david.johnson@email.com',
    enquiryType: 'website',
    enquiryDetails: 'Looking for information about wind energy solutions for rural property. Have 50 acres available and want to explore feasibility.',
    status: 'resolved',
    priority: 'medium',
    organization: 'Johnson Farm',
    location: 'Austin, TX',
    estimatedValue: 75000,
    resolutionNotes: 'Provided feasibility study and cost analysis. Customer satisfied with proposal.'
  },
  {
    visitorName: 'Sarah Chen',
    phoneNumber: '+1-555-0126',
    email: 'sarah.chen@startup.io',
    enquiryType: 'calls',
    enquiryDetails: 'Startup company looking for green energy consulting services. Need help with sustainability strategy and carbon footprint reduction.',
    status: 'escalated',
    priority: 'urgent',
    organization: 'EcoStart.io',
    location: 'Seattle, WA',
    estimatedValue: 25000,
    expectedCompletionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
  },
  {
    visitorName: 'Michael Brown',
    phoneNumber: '+1-555-0127',
    email: 'michael.brown@manufacturing.com',
    enquiryType: 'email',
    enquiryDetails: 'Manufacturing facility wants to switch to renewable energy. Currently spending $50k/month on electricity. Looking for ROI analysis.',
    status: 'new',
    priority: 'high',
    organization: 'Brown Manufacturing LLC',
    location: 'Detroit, MI',
    estimatedValue: 200000,
    expectedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
  },
  {
    visitorName: 'Lisa Wang',
    phoneNumber: '+1-555-0128',
    email: 'lisa.wang@school.edu',
    enquiryType: 'chatbot',
    enquiryDetails: 'School district interested in educational solar program. Want to install solar panels on 10 school buildings for educational purposes.',
    status: 'in_progress',
    priority: 'medium',
    organization: 'Central School District',
    location: 'Phoenix, AZ',
    estimatedValue: 120000,
    expectedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
  },
  {
    visitorName: 'Robert Taylor',
    phoneNumber: '+1-555-0129',
    email: 'robert.taylor@hotel.com',
    enquiryType: 'website',
    enquiryDetails: 'Hotel chain looking to implement comprehensive energy management system across 15 locations. Focus on cost reduction and sustainability.',
    status: 'new',
    priority: 'high',
    organization: 'Taylor Hotel Group',
    location: 'Miami, FL',
    estimatedValue: 300000,
    expectedCompletionDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) // 120 days from now
  },
  {
    visitorName: 'Emma Wilson',
    phoneNumber: '+1-555-0130',
    email: 'emma.wilson@nonprofit.org',
    enquiryType: 'calls',
    enquiryDetails: 'Non-profit organization seeking pro-bono or discounted renewable energy consultation for community center project.',
    status: 'resolved',
    priority: 'low',
    organization: 'Community Help Center',
    location: 'Denver, CO',
    estimatedValue: 5000,
    resolutionNotes: 'Provided discounted consultation. Referred to local green energy grant programs.'
  },
  {
    visitorName: 'James Martinez',
    phoneNumber: '+1-555-0131',
    email: 'james.martinez@retail.com',
    enquiryType: 'email',
    enquiryDetails: 'Retail chain wants to install EV charging stations at 25 store locations. Need infrastructure assessment and installation quotes.',
    status: 'in_progress',
    priority: 'medium',
    organization: 'Martinez Retail Corp',
    location: 'Chicago, IL',
    estimatedValue: 150000,
    expectedCompletionDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000) // 75 days from now
  },
  {
    visitorName: 'Amanda Clark',
    phoneNumber: '+1-555-0132',
    email: 'amanda.clark@residential.com',
    enquiryType: 'chatbot',
    enquiryDetails: 'Homeowner interested in complete home energy audit and smart home automation with renewable energy integration.',
    status: 'closed',
    priority: 'low',
    organization: 'Clark Residence',
    location: 'Portland, OR',
    estimatedValue: 8000,
    resolutionNotes: 'Project completed successfully. Customer very satisfied with energy savings.'
  }
];

async function seedEnquiries() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Set default MongoDB URI if not provided
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/ems-database';
      console.log('ℹ️  Using default MongoDB URI: mongodb://localhost:27017/ems-database');
    }
    
    await connectMongo();
    
    console.log('📊 Checking existing data...');
    
    // Get executives for assignment
    const executives = await User.find({ role: 'executive' }).lean();
    console.log(`📋 Found ${executives.length} executives for assignment`);
    
    if (executives.length === 0) {
      console.log('⚠️  No executives found. Creating sample executive...');
      const sampleExecutive = new User({
        username: 'executive1',
        email: 'executive1@envirocare.com',
        password: 'temp123', // Will be hashed by the model
        name: 'Sample Executive',
        role: 'executive',
        phone: '+1-555-9999'
      });
      await sampleExecutive.save();
      executives.push(sampleExecutive);
      console.log('✅ Created sample executive');
    }
    
    // Check if enquiries already exist
    const existingCount = await Enquiry.countDocuments();
    console.log(`📊 Found ${existingCount} existing enquiries`);
    
    if (existingCount > 0) {
      console.log('⚠️  Enquiries already exist. Do you want to add more? (y/n)');
      // For automation, we'll proceed with adding more
      console.log('🔄 Adding additional sample enquiries...');
    }
    
    console.log('🌱 Creating sample enquiries...');
    
    const enquiriesToCreate = sampleEnquiries.map((enquiry, index) => ({
      ...enquiry,
      // Assign executives in round-robin fashion
      assignedAgent: executives[index % executives.length]._id,
      // Add some status history
      statusHistory: [{
        status: enquiry.status,
        changedAt: new Date(),
        changedBy: 'system',
        notes: `Initial enquiry created with status: ${enquiry.status}`
      }]
    }));
    
    const createdEnquiries = await Enquiry.insertMany(enquiriesToCreate);
    
    console.log(`✅ Successfully created ${createdEnquiries.length} sample enquiries!`);
    console.log('📋 Summary:');
    
    // Show summary by status
    const statusCounts = await Enquiry.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    statusCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} enquiries`);
    });
    
    // Show summary by type
    console.log('📊 By Type:');
    const typeCounts = await Enquiry.aggregate([
      { $group: { _id: '$enquiryType', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    typeCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} enquiries`);
    });
    
    console.log('\n🎉 Sample enquiries have been added to your database!');
    console.log('🔗 You can now refresh your enquiries page to see the data.');
    
  } catch (error) {
    console.error('❌ Error seeding enquiries:', error);
    
    if (error.code === 11000) {
      console.log('⚠️  Duplicate key error - some enquiries might already exist with same email/phone');
    }
  } finally {
    console.log('🔌 Closing database connection...');
    process.exit(0);
  }
}

// Run the seeding script
if (require.main === module) {
  seedEnquiries();
}

module.exports = { seedEnquiries };
