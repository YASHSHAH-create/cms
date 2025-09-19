/**
 * Script to create sample visitors in the database
 * Run with: node create-sample-visitors.js
 */

const { connectMongo } = require('./config/mongo');
const Visitor = require('./models/Visitor');
const User = require('./models/User');

const sampleVisitors = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 98765 43210',
    organization: 'ABC Corp',
    region: 'Mumbai',
    service: 'Water Testing',
    subservice: 'Drinking Water Analysis',
    enquiryDetails: 'Need comprehensive water testing for our office building',
    source: 'chatbot',
    status: 'enquiry_required',
    comments: 'Initial enquiry received',
    amount: 5000,
    createdAt: new Date()
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91 98765 43211',
    organization: 'XYZ Ltd',
    region: 'Delhi',
    service: 'Food Testing',
    subservice: 'Nutritional Analysis',
    enquiryDetails: 'Require food testing for our new product line',
    source: 'email',
    status: 'converted',
    comments: 'Project completed successfully',
    amount: 15000,
    createdAt: new Date(Date.now() - 86400000) // 1 day ago
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    phone: '+91 98765 43212',
    organization: 'DEF Industries',
    region: 'Bangalore',
    service: 'Environmental Testing',
    subservice: 'Air Quality Testing',
    enquiryDetails: 'Environmental compliance testing required',
    source: 'calls',
    status: 'qualified',
    comments: 'Quotation sent, awaiting response',
    amount: 25000,
    createdAt: new Date(Date.now() - 172800000) // 2 days ago
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+91 98765 43213',
    organization: 'GHI Solutions',
    region: 'Chennai',
    service: 'Shelf-Life Study',
    subservice: 'Food Shelf-Life Analysis',
    enquiryDetails: 'Need shelf-life study for our packaged food products',
    source: 'website',
    status: 'contact_initiated',
    comments: 'Initial contact made, waiting for samples',
    amount: 12000,
    createdAt: new Date(Date.now() - 259200000) // 3 days ago
  },
  {
    name: 'David Brown',
    email: 'david.brown@example.com',
    phone: '+91 98765 43214',
    organization: 'JKL Enterprises',
    region: 'Pune',
    service: 'Water Testing',
    subservice: 'Industrial Water Analysis',
    enquiryDetails: 'Industrial water quality testing for manufacturing plant',
    source: 'chatbot',
    status: 'feasibility_check',
    comments: 'Feasibility study in progress',
    amount: 18000,
    createdAt: new Date(Date.now() - 345600000) // 4 days ago
  },
  {
    name: 'Lisa Garcia',
    email: 'lisa.garcia@example.com',
    phone: '+91 98765 43215',
    organization: 'MNO Corp',
    region: 'Hyderabad',
    service: 'Food Testing',
    subservice: 'Microbiological Testing',
    enquiryDetails: 'Microbiological testing for dairy products',
    source: 'email',
    status: 'quotation_sent',
    comments: 'Quotation sent, follow-up scheduled',
    amount: 22000,
    createdAt: new Date(Date.now() - 432000000) // 5 days ago
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@example.com',
    phone: '+91 98765 43216',
    organization: 'PQR Industries',
    region: 'Kolkata',
    service: 'Environmental Testing',
    subservice: 'Soil Testing',
    enquiryDetails: 'Soil contamination testing for industrial site',
    source: 'calls',
    status: 'negotiation_stage',
    comments: 'Price negotiation in progress',
    amount: 35000,
    createdAt: new Date(Date.now() - 518400000) // 6 days ago
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+91 98765 43217',
    organization: 'STU Ltd',
    region: 'Ahmedabad',
    service: 'Others',
    subservice: 'Custom Testing',
    enquiryDetails: 'Custom testing requirements for new product development',
    source: 'website',
    status: 'payment_received',
    comments: 'Payment received, project initiated',
    amount: 28000,
    createdAt: new Date(Date.now() - 604800000) // 7 days ago
  }
];

async function createSampleVisitors() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Set default MongoDB URI if not provided
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/ems-database';
      console.log('ℹ️  Using default MongoDB URI: mongodb://localhost:27017/ems-database');
    }
    
    await connectMongo();
    
    console.log('📊 Checking existing visitors...');
    
    // Get executives for assignment
    const executives = await User.find({ role: 'executive' }).lean();
    console.log(`📋 Found ${executives.length} executives for assignment`);
    
    if (executives.length === 0) {
      console.log('⚠️  No executives found. Creating sample executives...');
      const sampleExecutives = [
        {
          username: 'executive1',
          email: 'executive1@envirocare.com',
          password: 'temp123',
          name: 'Customer Experience Executive 1',
          role: 'executive',
          phone: '+91 98765 11111'
        },
        {
          username: 'executive2',
          email: 'executive2@envirocare.com',
          password: 'temp123',
          name: 'Customer Experience Executive 2',
          role: 'executive',
          phone: '+91 98765 22222'
        }
      ];
      
      for (const exec of sampleExecutives) {
        const newExecutive = new User(exec);
        await newExecutive.save();
        executives.push(newExecutive);
        console.log(`✅ Created executive: ${exec.name}`);
      }
    }
    
    // Check if visitors already exist
    const existingCount = await Visitor.countDocuments();
    console.log(`📊 Found ${existingCount} existing visitors`);
    
    if (existingCount > 0) {
      console.log('⚠️  Visitors already exist. Adding more sample visitors...');
    }
    
    console.log('🌱 Creating sample visitors...');
    
    const visitorsToCreate = sampleVisitors.map((visitor, index) => {
      // Assign executives based on service
      let assignedAgent = null;
      let agentName = null;
      
      if (visitor.service === 'Water Testing' || visitor.service === 'Shelf-Life Study') {
        assignedAgent = executives[0]._id;
        agentName = executives[0].name;
      } else {
        assignedAgent = executives[1]._id;
        agentName = executives[1].name;
      }
      
      return {
        ...visitor,
        assignedAgent,
        agent: agentName,
        agentName,
        isConverted: visitor.status === 'converted' || visitor.status === 'payment_received'
      };
    });
    
    const createdVisitors = await Visitor.insertMany(visitorsToCreate);
    
    console.log(`✅ Successfully created ${createdVisitors.length} sample visitors!`);
    console.log('📋 Summary:');
    
    // Show summary by status
    const statusCounts = await Visitor.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('📊 By Status:');
    statusCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} visitors`);
    });
    
    // Show summary by source
    console.log('📊 By Source:');
    const sourceCounts = await Visitor.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    sourceCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} visitors`);
    });
    
    // Show summary by service
    console.log('📊 By Service:');
    const serviceCounts = await Visitor.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    serviceCounts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} visitors`);
    });
    
    console.log('\n🎉 Sample visitors have been added to your database!');
    console.log('🔗 You can now refresh your visitors page to see the data.');
    console.log('📊 Total visitors in database:', await Visitor.countDocuments());
    
  } catch (error) {
    console.error('❌ Error creating sample visitors:', error);
    
    if (error.code === 11000) {
      console.log('⚠️  Duplicate key error - some visitors might already exist with same email');
    }
  } finally {
    console.log('🔌 Closing database connection...');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  createSampleVisitors();
}

module.exports = { createSampleVisitors };
