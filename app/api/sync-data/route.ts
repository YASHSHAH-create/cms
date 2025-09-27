import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/sync-data - Synchronizing data across collections');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get all visitors with agent assignments
    const visitorsWithAgents = await Visitor.find({
      assignedAgent: { $exists: true, $ne: null, $ne: '' }
    }).lean();

    console.log(`📊 Found ${visitorsWithAgents.length} visitors with agent assignments`);

    let syncCount = 0;
    const syncResults = [];

    // Sync each visitor's agent assignment to their enquiries
    for (const visitor of visitorsWithAgents) {
      const updatedEnquiries = await Enquiry.updateMany(
        { visitorId: visitor._id },
        {
          $set: {
            assignedAgent: visitor.assignedAgent,
            agentName: visitor.agentName || visitor.agent,
            lastModifiedBy: 'sync-process',
            lastModifiedAt: new Date()
          }
        }
      );

      if (updatedEnquiries.modifiedCount > 0) {
        syncCount += updatedEnquiries.modifiedCount;
        syncResults.push({
          visitorId: visitor._id.toString(),
          visitorName: visitor.name,
          agentName: visitor.agentName || visitor.agent,
          enquiriesUpdated: updatedEnquiries.modifiedCount
        });
      }
    }

    console.log(`✅ Synchronized ${syncCount} enquiries across ${syncResults.length} visitors`);

    const response = NextResponse.json({
      success: true,
      message: 'Data synchronization completed',
      syncCount: syncCount,
      visitorsProcessed: syncResults.length,
      results: syncResults
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Data sync API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to synchronize data',
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
    console.log('🔄 GET /api/sync-data - Checking data consistency');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Check for inconsistencies between Visitor and Enquiry collections
    const visitorsWithAgents = await Visitor.find({
      assignedAgent: { $exists: true, $ne: null, $ne: '' }
    }).lean();

    const inconsistencies = [];

    for (const visitor of visitorsWithAgents) {
      const enquiries = await Enquiry.find({ visitorId: visitor._id }).lean();
      
      for (const enquiry of enquiries) {
        if (enquiry.assignedAgent !== visitor.assignedAgent || 
            enquiry.agentName !== (visitor.agentName || visitor.agent)) {
          inconsistencies.push({
            visitorId: visitor._id.toString(),
            visitorName: visitor.name,
            visitorAgent: visitor.agentName || visitor.agent,
            enquiryAgent: enquiry.agentName,
            enquiryId: enquiry._id.toString()
          });
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Data consistency check completed',
      totalVisitors: visitorsWithAgents.length,
      inconsistencies: inconsistencies.length,
      details: inconsistencies
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Data consistency check error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to check data consistency',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
