import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import MemoryStorage from '@/lib/memoryStorage';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/visitors - Fetching visitors');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';

    console.log('📊 Visitors API params:', { page, limit, search, status, source });

    let visitors = [];
    let totalCount = 0;

    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB');

      // Build filter
      const filter: any = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }
      if (status) {
        filter.status = status;
      }
      if (source) {
        filter.source = source;
      }

      // Fetch visitors with pagination
      const [visitorsData, count] = await Promise.all([
        Visitor.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Visitor.countDocuments(filter)
      ]);

      visitors = visitorsData;
      totalCount = count;

      console.log(`📊 Found ${visitors.length} visitors (page ${page}/${Math.ceil(totalCount / limit)})`);

    } catch (mongoError) {
      console.log('⚠️ MongoDB connection failed, using memory storage');
      console.error('MongoDB error:', mongoError);
      
      // Use memory storage as fallback
      const memoryStorage = MemoryStorage.getInstance();
      const { visitors: memoryVisitors, count: memoryCount } = memoryStorage.getVisitors(
        { search, status, source },
        page,
        limit
      );
      
      visitors = memoryVisitors;
      totalCount = memoryCount;
      
      console.log(`📊 Memory storage: ${visitors.length} visitors`);
    }

    // Transform visitors data for frontend
    const transformedVisitors = visitors.map((visitor: any, index: number) => ({
      _id: visitor._id.toString(),
      srNo: (page - 1) * limit + index + 1,
      name: visitor.name || '',
      email: visitor.email || '',
      phone: visitor.phone || '',
      organization: visitor.organization || '',
      service: visitor.service || 'General Inquiry',
      subservice: visitor.subservice || '',
      source: visitor.source || 'chatbot',
      status: visitor.status || 'enquiry_required',
      priority: visitor.priority || 'medium',
      createdAt: visitor.createdAt || visitor.lastInteractionAt || new Date(),
      lastInteractionAt: visitor.lastInteractionAt || visitor.createdAt || new Date(),
      isConverted: visitor.isConverted || false,
      agentName: visitor.agentName || '',
      salesExecutiveName: visitor.salesExecutiveName || '',
      comments: visitor.comments || '',
      amount: visitor.amount || 0,
      enquiryDetails: visitor.enquiryDetails || ''
    }));

    const response = NextResponse.json({
      success: true,
      visitors: transformedVisitors,
      count: totalCount,
      page: page,
      totalPages: Math.ceil(totalCount / limit),
      message: 'Visitors loaded successfully'
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('❌ Visitors API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to load visitors',
      error: error instanceof Error ? error.message : 'Unknown error',
      visitors: [],
      count: 0,
      page: 1,
      totalPages: 0
    }, { status: 500 });

    // Add CORS headers even for errors
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/visitors - Creating visitor');
    
    const body = await request.json();
    console.log('📝 Visitor data:', body);

    const {
      name,
      email,
      phone,
      organization,
      service,
      subservice,
      source,
      enquiryDetails
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Name is required'
      }, { status: 400 });
    }

    let savedVisitor;

    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB');

      // Check if visitor already exists
      let existingVisitor = null;
      if (phone) {
        existingVisitor = await Visitor.findOne({ phone: phone });
      }
      if (!existingVisitor && email) {
        existingVisitor = await Visitor.findOne({ email: email });
      }

      if (existingVisitor) {
        // Update existing visitor
        existingVisitor.name = name;
        existingVisitor.email = email || existingVisitor.email;
        existingVisitor.phone = phone || existingVisitor.phone;
        existingVisitor.organization = organization || existingVisitor.organization;
        existingVisitor.service = service || existingVisitor.service;
        existingVisitor.subservice = subservice || existingVisitor.subservice;
        existingVisitor.source = source || existingVisitor.source;
        existingVisitor.lastInteractionAt = new Date();
        
        savedVisitor = await existingVisitor.save();
        console.log('✅ Existing visitor updated:', savedVisitor._id);
      } else {
        // Create new visitor
        const visitorData = {
          name,
          email: email || '',
          phone: phone || '',
          organization: organization || '',
          service: service || 'General Inquiry',
          subservice: subservice || '',
          source: source || 'chatbot',
          location: '',
          meta: {},
          lastInteractionAt: new Date(),
          isConverted: false,
          status: 'enquiry_required',
          leadScore: 0,
          priority: 'medium',
          pipelineHistory: []
        };
        
        const visitor = new Visitor(visitorData);
        savedVisitor = await visitor.save();
        console.log('✅ New visitor created:', savedVisitor._id);
      }

    } catch (mongoError) {
      console.log('⚠️ MongoDB connection failed, using memory storage');
      console.error('MongoDB error:', mongoError);
      
      // Use memory storage as fallback
      const memoryStorage = MemoryStorage.getInstance();
      const visitorData = {
        name,
        email: email || '',
        phone: phone || '',
        organization: organization || '',
        service: service || 'General Inquiry',
        subservice: subservice || '',
        source: source || 'chatbot',
        enquiryDetails: enquiryDetails || '',
        status: 'enquiry_required',
        priority: 'medium',
        lastModifiedBy: 'system',
        lastModifiedAt: new Date()
      };
      
      savedVisitor = memoryStorage.addVisitor(visitorData);
      console.log('✅ Visitor saved to memory storage:', savedVisitor._id);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Visitor saved successfully',
      visitor: {
        _id: savedVisitor._id,
        name: savedVisitor.name,
        email: savedVisitor.email,
        phone: savedVisitor.phone,
        organization: savedVisitor.organization,
        service: savedVisitor.service,
        subservice: savedVisitor.subservice,
        source: savedVisitor.source,
        status: savedVisitor.status,
        createdAt: savedVisitor.createdAt
      }
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('❌ Create visitor API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to create visitor',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });

    // Add CORS headers even for errors
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}