import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function updateEnquiry(request: NextRequest, user: any) {
  try {
    console.log('🔄 PUT /api/analytics/update-enquiry - Updating enquiry');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const body = await request.json();
    console.log('📝 Request body:', body);

    const {
      enquiryId,
      visitorName,
      phoneNumber,
      email,
      enquiryType,
      enquiryDetails
    } = body;

    // Validate required fields
    if (!enquiryId) {
      return NextResponse.json({
        success: false,
        message: 'Enquiry ID is required'
      }, { status: 400 });
    }

    // Find the visitor/enquiry record
    const existingVisitor = await Visitor.findById(enquiryId);
    if (!existingVisitor) {
      return NextResponse.json({
        success: false,
        message: 'Enquiry not found'
      }, { status: 404 });
    }

    // Update the visitor record
    const updateData: any = {
      lastModifiedBy: user.username || 'admin',
      lastModifiedAt: new Date()
    };

    if (visitorName) updateData.name = visitorName;
    if (phoneNumber !== undefined) updateData.phone = phoneNumber;
    if (email !== undefined) updateData.email = email;
    if (enquiryType) updateData.source = enquiryType;
    if (enquiryDetails) updateData.enquiryDetails = enquiryDetails;

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      enquiryId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Enquiry updated:', updatedVisitor._id);

    // Transform the updated visitor to match frontend Enquiry type
    const enquiryResponse = {
      _id: updatedVisitor._id.toString(),
      visitorName: updatedVisitor.name || 'Unknown',
      phoneNumber: updatedVisitor.phone || '',
      email: updatedVisitor.email || '',
      enquiryType: (['chatbot','email','calls','website'].includes(updatedVisitor.source) ? updatedVisitor.source : 'chatbot') as any,
      enquiryDetails: updatedVisitor.enquiryDetails || 'General enquiry',
      createdAt: updatedVisitor.createdAt,
      status: updatedVisitor.status || 'new',
      assignedAgent: updatedVisitor.agentName || updatedVisitor.agent || 'Unassigned',
      service: updatedVisitor.service || 'General Inquiry',
      subservice: updatedVisitor.subservice || '',
      organization: updatedVisitor.organization || '',
      region: updatedVisitor.region || '',
      salesExecutive: updatedVisitor.salesExecutiveName || updatedVisitor.salesExecutive || '',
      comments: updatedVisitor.comments || '',
      amount: updatedVisitor.amount || 0
    };

    return NextResponse.json({
      success: true,
      message: 'Enquiry updated successfully',
      enquiry: enquiryResponse
    });

  } catch (error) {
    console.error('❌ Update enquiry API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update enquiry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const PUT = async (request: NextRequest) => {
  try {
    return await updateEnquiry(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Update enquiry API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update enquiry'
    }, { status: 500 });
  }
};
