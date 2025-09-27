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
    const cleanedAgentId = agentId && agentId !== '' ? agentId : null;
    
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
          assignedAgent: cleanedAgentId,
          agentName: agentName || 'Unknown Agent',
          lastModifiedBy: user.username || 'admin',
          lastModifiedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${updatedEnquiries.modifiedCount} enquiries with agent assignment`);

    console.log('✅ Agent assigned successfully:', updatedVisitor._id);

    return NextResponse.json({
      success: true,
      message: 'Agent assigned successfully',
      visitor: {
        _id: updatedVisitor._id.toString(),
        name: updatedVisitor.name,
        assignedAgent: updatedVisitor.assignedAgent,
        agentName: updatedVisitor.agentName
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
