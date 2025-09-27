import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import MemoryStorage from '@/lib/memoryStorage';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/analytics/add-enquiry - Adding new enquiry');
    
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

    // Try MongoDB connection, fallback to mock data if it fails
    let savedVisitor;
    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB');

      // First, handle visitor data
      let visitor = null;
      
      // Check if visitor with same phone/email already exists
      if (phoneNumber?.trim()) {
        visitor = await Visitor.findOne({ phone: phoneNumber.trim() });
      }
      if (!visitor && email?.trim()) {
        visitor = await Visitor.findOne({ email: email.trim() });
      }

      if (!visitor) {
        // Create new visitor
        const visitorData = {
          name: visitorName,
          email: email?.trim() || '',
          phone: phoneNumber?.trim() || '',
          organization: '',
          service: 'General Inquiry',
          subservice: '',
          source: enquiryType || 'chatbot',
          location: '',
          meta: {},
          lastInteractionAt: new Date(),
          isConverted: false,
          status: 'enquiry_required',
          leadScore: 0,
          priority: 'medium',
          pipelineHistory: []
        };
        
        visitor = new Visitor(visitorData);
        await visitor.save();
        console.log('✅ New visitor created:', visitor._id);
      } else {
        // Update existing visitor's last interaction
        visitor.lastInteractionAt = new Date();
        await visitor.save();
        console.log('✅ Existing visitor updated:', visitor._id);
      }

      // Now create the enquiry record
      const enquiryData = {
        visitorId: visitor._id,
        visitorName: visitorName,
        phoneNumber: phoneNumber?.trim() || '',
        email: email?.trim() || '',
        enquiryType: enquiryType || 'chatbot',
        enquiryDetails: enquiryDetails,
        status: 'new',
        priority: 'medium',
        assignedAgent: null,
        comments: '',
        amount: 0
      };

      const enquiry = new Enquiry(enquiryData);
      await enquiry.save();
      console.log('✅ New enquiry created:', enquiry._id);

      // Return visitor data for response
      savedVisitor = {
        _id: visitor._id,
        name: visitor.name,
        phone: visitor.phone,
        email: visitor.email,
        enquiryDetails: enquiryDetails,
        source: enquiryType || 'chatbot',
        status: 'enquiry_required',
        createdAt: visitor.createdAt,
        service: visitor.service || 'General Inquiry',
        subservice: visitor.subservice || '',
        organization: visitor.organization || '',
        region: visitor.region || '',
        agentName: visitor.agentName || '',
        salesExecutiveName: visitor.salesExecutiveName || '',
        comments: '',
        amount: 0
      };

    } catch (mongoError) {
      console.log('⚠️ MongoDB connection failed, using memory storage');
      console.error('MongoDB error:', mongoError);
      
      // Use memory storage as fallback
      const memoryStorage = MemoryStorage.getInstance();
      
      const enquiryData = {
        name: visitorName,
        phone: phoneNumber?.trim() || '',
        email: email?.trim() || '',
        enquiryDetails: enquiryDetails,
        source: enquiryType || 'chatbot',
        status: 'new',
        service: 'General Inquiry',
        subservice: '',
        organization: '',
        region: '',
        agentName: '',
        salesExecutiveName: '',
        comments: '',
        amount: 0,
        isConverted: false,
        priority: 'medium',
        lastModifiedBy: 'admin',
        lastModifiedAt: new Date()
      };
      
      savedVisitor = memoryStorage.addEnquiry(enquiryData);
      console.log('✅ Enquiry saved to memory storage:', savedVisitor._id);
      console.log('📊 Enquiry data saved:', {
        name: savedVisitor.name,
        email: savedVisitor.email,
        phone: savedVisitor.phone,
        enquiryDetails: savedVisitor.enquiryDetails
      });
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