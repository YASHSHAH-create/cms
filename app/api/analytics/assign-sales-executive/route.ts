import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/analytics/assign-sales-executive - Assigning sales executive to visitor');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const body = await request.json();
    console.log('📝 Request body:', body);

    const { visitorId, salesExecutiveId, salesExecutiveName } = body;

    // Validate required fields
    if (!visitorId) {
      return NextResponse.json({
        success: false,
        message: 'Visitor ID is required'
      }, { status: 400 });
    }

    // Find the visitor
    const visitor = await Visitor.findById(visitorId);
    
    if (!visitor) {
      return NextResponse.json({
        success: false,
        message: 'Visitor not found'
      }, { status: 404 });
    }

    // Clean up the sales executive assignment data
    // Handle both ObjectId and string IDs properly
    let cleanedSalesExecId = null;
    if (salesExecutiveId && salesExecutiveId !== '') {
      // If it's a string ID (like "vishal_1"), store it in salesExecutiveName instead
      if (typeof salesExecutiveId === 'string' && !salesExecutiveId.match(/^[0-9a-fA-F]{24}$/)) {
        // This is a string ID, not a valid ObjectId
        cleanedSalesExecId = null; // Don't store in salesExecutive field
        console.log('⚠️ String ID detected, storing in salesExecutiveName instead:', salesExecutiveId);
      } else {
        // This is a valid ObjectId
        cleanedSalesExecId = salesExecutiveId;
      }
    }
    
    // Update the visitor with sales executive assignment
    const updatedVisitor = await Visitor.findByIdAndUpdate(
      visitorId,
      {
        salesExecutive: cleanedSalesExecId,
        salesExecutiveName: salesExecutiveName || 'Unknown Sales Executive',
        lastModifiedBy: 'admin',
        lastModifiedAt: new Date(),
        $push: {
          assignmentHistory: {
            assignedBy: 'admin',
            assignedTo: salesExecutiveName || 'Unknown Sales Executive',
            assignedAt: new Date(),
            reason: 'Manual sales executive assignment'
          }
        }
      },
      { new: true, runValidators: true }
    );

    // CRITICAL: Also update the Enquiry collection for data synchronization
    console.log('🔄 Synchronizing sales executive assignment with Enquiry collection...');
    const updatedEnquiries = await Enquiry.updateMany(
      { visitorId: visitorId },
      {
        $set: {
          salesExecutive: cleanedSalesExecId, // Only set if it's a valid ObjectId
          salesExecutiveName: salesExecutiveName || 'Unknown Sales Executive', // Always store sales executive name
          lastModifiedBy: 'admin',
          lastModifiedAt: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${updatedEnquiries.modifiedCount} enquiries with sales executive assignment`);

    console.log('✅ Sales executive assigned successfully:', updatedVisitor._id);

    // Return the complete updated visitor object so frontend can update immediately
    const response = NextResponse.json({
      success: true,
      message: 'Sales executive assigned successfully',
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
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Assign sales executive API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to assign sales executive',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
