import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function updateVisitorDetails(request: NextRequest, user: any) {
  try {
    console.log('🔄 PUT /api/analytics/update-visitor-details - Updating visitor details');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const body = await request.json();
    console.log('📝 Request body:', body);

    const { visitorId, ...updateData } = body;

    // Validate required fields
    if (!visitorId) {
      return NextResponse.json({
        success: false,
        message: 'Visitor ID is required'
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

    // Clean up the update data to handle empty strings for ObjectId fields
    const cleanedUpdateData = { ...updateData };
    
    // Convert empty strings to null for ObjectId fields
    const objectIdFields = ['assignedAgent', 'salesExecutive', 'customerExecutive'];
    objectIdFields.forEach(field => {
      if (cleanedUpdateData[field] === '' || cleanedUpdateData[field] === null) {
        cleanedUpdateData[field] = null;
      }
    });

    // Update the visitor with new data using the correct model
    const updatedVisitor = isNewModel 
      ? await Visitor.findByIdAndUpdate(
          visitorId,
          {
            ...cleanedUpdateData,
            lastModifiedBy: user.username || 'admin',
            lastModifiedAt: new Date()
          },
          { new: true, runValidators: true }
        )
      : await Visitor.findByIdAndUpdate(
          visitorId,
          {
            ...cleanedUpdateData,
            lastModifiedBy: user.username || 'admin',
            lastModifiedAt: new Date()
          },
          { new: true, runValidators: true }
        );

    console.log('✅ Visitor details updated successfully:', updatedVisitor._id);

    return NextResponse.json({
      success: true,
      message: 'Visitor details updated successfully',
      visitor: {
        _id: updatedVisitor._id.toString(),
        name: updatedVisitor.name,
        email: updatedVisitor.email,
        phone: updatedVisitor.phone,
        service: updatedVisitor.service,
        status: updatedVisitor.status,
        enquiryDetails: updatedVisitor.enquiryDetails
      }
    });

  } catch (error) {
    console.error('❌ Update visitor details API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update visitor details',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const PUT = async (request: NextRequest) => {
  try {
    return await updateVisitorDetails(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Update visitor details API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update visitor details'
    }, { status: 500 });
  }
};
