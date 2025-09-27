import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 POST /api/seed-enquiries - Seeding database with sample data');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Create sample visitors
    const sampleVisitors = [
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        phone: '+1-555-0101',
        organization: 'GreenTech Solutions',
        service: 'Environmental Consulting',
        source: 'website',
        status: 'active',
        location: 'New York, NY',
        lastInteractionAt: new Date(),
        isConverted: false
      },
      {
        name: 'Bob Smith',
        email: 'bob.smith@enterprise.com',
        phone: '+1-555-0102',
        organization: 'Enterprise Corp',
        service: 'Waste Management',
        source: 'email',
        status: 'active',
        location: 'Los Angeles, CA',
        lastInteractionAt: new Date(),
        isConverted: true
      },
      {
        name: 'Carol Davis',
        email: 'carol.davis@startup.io',
        phone: '+1-555-0103',
        organization: 'EcoStartup',
        service: 'Air Quality Monitoring',
        source: 'chatbot',
        status: 'active',
        location: 'San Francisco, CA',
        lastInteractionAt: new Date(),
        isConverted: false
      }
    ];

    // Create visitors in database
    const createdVisitors = [];
    for (const visitorData of sampleVisitors) {
      const visitor = new Visitor(visitorData);
      const savedVisitor = await visitor.save();
      createdVisitors.push(savedVisitor);
      console.log(`✅ Created visitor: ${savedVisitor.name} (${savedVisitor._id})`);
    }

    // Create sample enquiries linked to visitors
    const sampleEnquiries = [
      {
        visitorId: createdVisitors[0]._id,
        visitorName: createdVisitors[0].name,
        email: createdVisitors[0].email,
        phoneNumber: createdVisitors[0].phone,
        enquiryType: 'website',
        enquiryDetails: 'Interested in comprehensive environmental impact assessment for our new manufacturing facility. Need detailed analysis of air, water, and soil quality impacts.',
        status: 'new',
        priority: 'high',
        service: 'Environmental Consulting',
        organization: createdVisitors[0].organization,
        comments: 'High priority client - large enterprise',
        amount: 25000,
        customerExecutive: null,
        salesExecutive: null,
        assignedAgent: null
      },
      {
        visitorId: createdVisitors[1]._id,
        visitorName: createdVisitors[1].name,
        email: createdVisitors[1].email,
        phoneNumber: createdVisitors[1].phone,
        enquiryType: 'email',
        enquiryDetails: 'Looking for waste management solutions for our corporate offices. Need recycling programs and waste reduction strategies.',
        status: 'in_progress',
        priority: 'medium',
        service: 'Waste Management',
        organization: createdVisitors[1].organization,
        comments: 'Follow up scheduled for next week',
        amount: 15000,
        customerExecutive: null,
        salesExecutive: null,
        assignedAgent: null
      },
      {
        visitorId: createdVisitors[2]._id,
        visitorName: createdVisitors[2].name,
        email: createdVisitors[2].email,
        phoneNumber: createdVisitors[2].phone,
        enquiryType: 'chatbot',
        enquiryDetails: 'Startup company needs air quality monitoring solutions for our office space. Looking for cost-effective options.',
        status: 'new',
        priority: 'low',
        service: 'Air Quality Monitoring',
        organization: createdVisitors[2].organization,
        comments: 'Budget-conscious startup',
        amount: 5000,
        customerExecutive: null,
        salesExecutive: null,
        assignedAgent: null
      }
    ];

    // Create enquiries in database
    const createdEnquiries = [];
    for (const enquiryData of sampleEnquiries) {
      const enquiry = new Enquiry(enquiryData);
      const savedEnquiry = await enquiry.save();
      createdEnquiries.push(savedEnquiry);
      console.log(`✅ Created enquiry: ${savedEnquiry.visitorName} - ${savedEnquiry.service} (${savedEnquiry._id})`);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        visitorsCreated: createdVisitors.length,
        enquiriesCreated: createdEnquiries.length,
        visitors: createdVisitors.map(v => ({ _id: v._id, name: v.name, email: v.email })),
        enquiries: createdEnquiries.map(e => ({ _id: e._id, visitorName: e.visitorName, service: e.service }))
      }
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Seed enquiries API error:', error);
    const response = NextResponse.json({
      success: false,
      message: 'Failed to seed database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
