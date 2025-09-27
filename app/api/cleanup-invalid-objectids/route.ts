import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/cleanup-invalid-objectids - Cleaning up invalid ObjectIds');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Find all documents with invalid assignedAgent values
    const visitorsWithInvalidIds = await Visitor.find({
      assignedAgent: { $exists: true, $ne: null }
    }).lean();

    const enquiriesWithInvalidIds = await Enquiry.find({
      assignedAgent: { $exists: true, $ne: null }
    }).lean();

    console.log(`📊 Found ${visitorsWithInvalidIds.length} visitors and ${enquiriesWithInvalidIds.length} enquiries with assignedAgent`);

    let visitorsFixed = 0;
    let enquiriesFixed = 0;
    const cleanupResults = [];

    // Clean up Visitor collection
    for (const visitor of visitorsWithInvalidIds) {
      if (visitor.assignedAgent && typeof visitor.assignedAgent === 'string' && !visitor.assignedAgent.match(/^[0-9a-fA-F]{24}$/)) {
        // This is an invalid ObjectId, move it to agentName
        await Visitor.findByIdAndUpdate(visitor._id, {
          $set: {
            agentName: visitor.assignedAgent,
            assignedAgent: null
          }
        });
        visitorsFixed++;
        cleanupResults.push({
          collection: 'Visitor',
          id: visitor._id.toString(),
          name: visitor.name,
          invalidId: visitor.assignedAgent,
          action: 'Moved to agentName'
        });
      }
    }

    // Clean up Enquiry collection
    for (const enquiry of enquiriesWithInvalidIds) {
      if (enquiry.assignedAgent && typeof enquiry.assignedAgent === 'string' && !enquiry.assignedAgent.match(/^[0-9a-fA-F]{24}$/)) {
        // This is an invalid ObjectId, move it to agentName
        await Enquiry.findByIdAndUpdate(enquiry._id, {
          $set: {
            agentName: enquiry.assignedAgent,
            assignedAgent: null
          }
        });
        enquiriesFixed++;
        cleanupResults.push({
          collection: 'Enquiry',
          id: enquiry._id.toString(),
          name: enquiry.visitorName,
          invalidId: enquiry.assignedAgent,
          action: 'Moved to agentName'
        });
      }
    }

    console.log(`✅ Cleaned up ${visitorsFixed} visitors and ${enquiriesFixed} enquiries`);

    const response = NextResponse.json({
      success: true,
      message: 'Invalid ObjectIds cleaned up successfully',
      visitorsFixed: visitorsFixed,
      enquiriesFixed: enquiriesFixed,
      totalFixed: visitorsFixed + enquiriesFixed,
      results: cleanupResults
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Cleanup API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to cleanup invalid ObjectIds',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/cleanup-invalid-objectids - Checking for invalid ObjectIds');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Find all documents with potentially invalid assignedAgent values
    const visitorsWithIds = await Visitor.find({
      assignedAgent: { $exists: true, $ne: null }
    }).lean();

    const enquiriesWithIds = await Enquiry.find({
      assignedAgent: { $exists: true, $ne: null }
    }).lean();

    const invalidVisitors = visitorsWithIds.filter(visitor => 
      visitor.assignedAgent && typeof visitor.assignedAgent === 'string' && !visitor.assignedAgent.match(/^[0-9a-fA-F]{24}$/)
    );

    const invalidEnquiries = enquiriesWithIds.filter(enquiry => 
      enquiry.assignedAgent && typeof enquiry.assignedAgent === 'string' && !enquiry.assignedAgent.match(/^[0-9a-fA-F]{24}$/)
    );

    const response = NextResponse.json({
      success: true,
      message: 'Invalid ObjectId check completed',
      totalVisitors: visitorsWithIds.length,
      totalEnquiries: enquiriesWithIds.length,
      invalidVisitors: invalidVisitors.length,
      invalidEnquiries: invalidEnquiries.length,
      totalInvalid: invalidVisitors.length + invalidEnquiries.length,
      details: {
        invalidVisitors: invalidVisitors.map(v => ({
          id: v._id.toString(),
          name: v.name,
          invalidId: v.assignedAgent
        })),
        invalidEnquiries: invalidEnquiries.map(e => ({
          id: e._id.toString(),
          name: e.visitorName,
          invalidId: e.assignedAgent
        }))
      }
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Invalid ObjectId check error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to check for invalid ObjectIds',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
