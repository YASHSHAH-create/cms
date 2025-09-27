import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Enquiry from '@/lib/models/Enquiry';
import Visitor from '@/lib/models/Visitor';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function deleteEnquiry(request: NextRequest, user: any, context: { params: Promise<{ enquiryId: string }> }) {
  try {
    console.log('🔄 DELETE /api/analytics/delete-enquiry/[enquiryId] - Deleting enquiry');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const { enquiryId } = await context.params;
    console.log('📝 Enquiry ID:', enquiryId);

    // Validate required fields
    if (!enquiryId) {
      return NextResponse.json({
        success: false,
        message: 'Enquiry ID is required'
      }, { status: 400 });
    }

    // Delete from Enquiry collection
    let deletedEnquiry = await Enquiry.findByIdAndDelete(enquiryId);
    
    if (!deletedEnquiry) {
      return NextResponse.json({
        success: false,
        message: 'Enquiry not found'
      }, { status: 404 });
    }

    console.log('✅ Enquiry deleted successfully:', deletedEnquiry._id);

    return NextResponse.json({
      success: true,
      message: 'Enquiry deleted successfully',
      deletedEnquiry: {
        _id: deletedEnquiry._id.toString(),
        visitorName: deletedEnquiry.visitorName,
        email: deletedEnquiry.email,
        phoneNumber: deletedEnquiry.phoneNumber
      }
    });

  } catch (error) {
    console.error('❌ Delete enquiry API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete enquiry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const DELETE = async (request: NextRequest, context: { params: Promise<{ enquiryId: string }> }) => {
  try {
    return await deleteEnquiry(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' }, context);
  } catch (error) {
    console.error('Delete enquiry API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete enquiry'
    }, { status: 500 });
  }
};