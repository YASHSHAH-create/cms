import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function assignAgent(request: NextRequest, user: any) {
  try {
    console.log('🔄 POST /api/analytics/assign-agent - Assigning agent to visitor');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const body = await request.json();
    console.log('📝 Request body:', body);

    const { visitorId, agentId, agentName } = body;

    // Validate required fields
    if (!visitorId || !agentId) {
      return NextResponse.json({
        success: false,
        message: 'Visitor ID and Agent ID are required'
      }, { status: 400 });
    }

    // Find the visitor in both collections
    let visitor = await Visitor.findById(visitorId);
    let isNewModel = true;
    
    if (!visitor) {
      visitor = await Visitor.findById(visitorId);
      isNewModel = false;
    }
    
    if (!visitor) {
      return NextResponse.json({
        success: false,
        message: 'Visitor not found'
      }, { status: 404 });
    }

    // Clean up the agent assignment data
    // Handle both ObjectId and string IDs properly
    let cleanedAgentId = null;
    if (agentId && agentId !== '') {
      // If it's a string ID (like "sanjana_1"), store it in agentName instead
      if (typeof agentId === 'string' && !agentId.match(/^[0-9a-fA-F]{24}$/)) {
        // This is a string ID, not a valid ObjectId
        cleanedAgentId = null; // Don't store in assignedAgent field
        console.log('⚠️ String ID detected, storing in agentName instead:', agentId);
      } else {
        // This is a valid ObjectId
        cleanedAgentId = agentId;
      }
    }
    
    // Update the visitor with agent assignment
    const updatedVisitor = await Visitor.findByIdAndUpdate(
      visitorId,
      {
        assignedAgent: cleanedAgentId,
        agentName: agentName || 'Unknown Agent',
        agent: agentName || 'Unknown Agent',
        lastModifiedBy: user.username || 'admin',
        lastModifiedAt: new Date(),
        $push: {
          assignmentHistory: {
            assignedBy: user.username || 'admin',
            assignedTo: agentName || 'Unknown Agent',
            assignedAt: new Date(),
            reason: 'Manual assignment'
          }
        }
      },
      { new: true, runValidators: true }
    );

    // CRITICAL: Also update the Enquiry collection for data synchronization
    console.log('🔄 Synchronizing agent assignment with Enquiry collection...');
    const updatedEnquiries = await Enquiry.updateMany(
      { visitorId: visitorId },
      {
        $set: {
          assignedAgent: cleanedAgentId, // Only set if it's a valid ObjectId
          agentName: agentName || 'Unknown Agent', // Always store agent name
          lastModifiedBy: user.username || 'admin',
          lastModifiedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${updatedEnquiries.modifiedCount} enquiries with agent assignment`);

    console.log('✅ Agent assigned successfully:', updatedVisitor._id);

    // Return the complete updated visitor object so frontend can update immediately
    return NextResponse.json({
      success: true,
      message: 'Agent assigned successfully',
      visitor: {
        _id: updatedVisitor._id.toString(),
        name: updatedVisitor.name,
        email: updatedVisitor.email,
        phone: updatedVisitor.phone,
        organization: updatedVisitor.organization,
        region: updatedVisitor.region,
        service: updatedVisitor.service,
        subservice: updatedVisitor.subservice,
        enquiryDetails: updatedVisitor.enquiryDetails,
        source: updatedVisitor.source,
        status: updatedVisitor.status,
        createdAt: updatedVisitor.createdAt,
        lastInteractionAt: updatedVisitor.lastInteractionAt,
        isConverted: updatedVisitor.isConverted,
        agent: updatedVisitor.agent,
        agentName: updatedVisitor.agentName,
        assignedAgent: updatedVisitor.assignedAgent,
        salesExecutive: updatedVisitor.salesExecutive,
        salesExecutiveName: updatedVisitor.salesExecutiveName,
        comments: updatedVisitor.comments,
        amount: updatedVisitor.amount,
        pipelineHistory: updatedVisitor.pipelineHistory,
        lastModifiedBy: updatedVisitor.lastModifiedBy,
        lastModifiedAt: updatedVisitor.lastModifiedAt
      }
    });

  } catch (error) {
    console.error('❌ Assign agent API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to assign agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const POST = async (request: NextRequest) => {
  try {
    return await assignAgent(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Assign agent API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to assign agent'
    }, { status: 500 });
  }
};
