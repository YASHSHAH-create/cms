import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import VisitorNew from '@/lib/models/VisitorNew';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function addEnquiry(request: NextRequest, user: any) {
  try {
    console.log('🔄 POST /api/analytics/add-enquiry - Adding new enquiry');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const body = await request.json();
    console.log('📝 Request body:', body);

    const {
      visitorName,
      phoneNumber,
      email,
      enquiryType,
      enquiryDetails
    } = body;

    // Validate required fields
    if (!visitorName || !enquiryDetails) {
      return NextResponse.json({
        success: false,
        message: 'Visitor name and enquiry details are required'
      }, { status: 400 });
    }

    // Validate that either phone or email is provided
    if (!phoneNumber?.trim() && !email?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Either phone number or email address is required'
      }, { status: 400 });
    }

    // Create new visitor/enquiry record
    const visitorData: any = {
      name: visitorName,
      service: 'General Inquiry', // Default service
      subservice: '',
      enquiryDetails: enquiryDetails,
      source: enquiryType || 'chatbot',
      status: 'enquiry_required',
      isConverted: false,
      organization: '',
      region: '',
      agent: '',
      agentName: '',
      assignedAgent: null,
      salesExecutive: null,
      salesExecutiveName: '',
      customerExecutive: null,
      customerExecutiveName: '',
      comments: '',
      amount: 0,
      pipelineHistory: [],
      version: 1,
      lastModifiedBy: user.username || 'admin',
      lastModifiedAt: new Date(),
      assignmentHistory: []
    };

    // Only add phone and email if they have values
    if (phoneNumber?.trim()) {
      visitorData.phone = phoneNumber.trim();
    }
    if (email?.trim()) {
      visitorData.email = email.trim();
    }

    // Ensure at least one contact method is provided
    if (!visitorData.phone && !visitorData.email) {
      return NextResponse.json({
        success: false,
        message: 'At least one contact method (phone or email) is required'
      }, { status: 400 });
    }

    // Check if visitor with same phone/email already exists
    let existingVisitor = null;
    if (visitorData.phone) {
      existingVisitor = await VisitorNew.findOne({ phone: visitorData.phone });
    }
    if (!existingVisitor && visitorData.email) {
      existingVisitor = await VisitorNew.findOne({ email: visitorData.email });
    }

    let savedVisitor;
    if (existingVisitor) {
      // Update existing visitor instead of creating new one
      existingVisitor.enquiryDetails = visitorData.enquiryDetails;
      existingVisitor.source = visitorData.source;
      existingVisitor.lastModifiedBy = visitorData.lastModifiedBy;
      existingVisitor.lastModifiedAt = visitorData.lastModifiedAt;
      
      savedVisitor = await existingVisitor.save();
      console.log('✅ Existing enquiry updated:', savedVisitor._id);
    } else {
      // Create new visitor
      const newVisitor = new VisitorNew(visitorData);
      savedVisitor = await newVisitor.save();
      console.log('✅ New enquiry created:', savedVisitor._id);
    }

    // Transform the saved visitor to match frontend Enquiry type
    const enquiryResponse = {
      _id: savedVisitor._id.toString(),
      visitorName: savedVisitor.name || 'Unknown',
      phoneNumber: savedVisitor.phone || '',
      email: savedVisitor.email || '',
      enquiryType: (['chatbot','email','calls','website'].includes(savedVisitor.source) ? savedVisitor.source : 'chatbot') as any,
      enquiryDetails: savedVisitor.enquiryDetails || 'General enquiry',
      createdAt: savedVisitor.createdAt,
      status: savedVisitor.status || 'new',
      assignedAgent: savedVisitor.agentName || savedVisitor.agent || 'Unassigned',
      service: savedVisitor.service || 'General Inquiry',
      subservice: savedVisitor.subservice || '',
      organization: savedVisitor.organization || '',
      region: savedVisitor.region || '',
      salesExecutive: savedVisitor.salesExecutiveName || savedVisitor.salesExecutive || '',
      comments: savedVisitor.comments || '',
      amount: savedVisitor.amount || 0
    };

    return NextResponse.json({
      success: true,
      message: 'Enquiry added successfully',
      enquiry: enquiryResponse
    });

  } catch (error) {
    console.error('❌ Add enquiry API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to add enquiry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Use authenticated handler
export const POST = createAuthenticatedHandler(requireAdminOrExecutive(addEnquiry));
