import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';
import MemoryStorage from '@/lib/memoryStorage';
import { corsHeaders } from '@/lib/cors';

async function getExecutiveEnquiriesManagement(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/analytics/executive-enquiries-management - Fetching executive enquiries');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const executiveId = searchParams.get('executiveId') || '';

    const pageNum = Math.max(page, 1);
    const limitNum = Math.min(Math.max(limit, 1), 200);

    // Build filter for executive enquiries
    let filter: any = {};
    
    // Filter by executive if provided
    if (executiveId) {
      filter.$or = [
        { customerExecutive: executiveId },
        { salesExecutive: executiveId },
        { assignedAgent: executiveId }
      ];
    }
    
    // Add search filters
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const searchFilter = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { organization: searchRegex },
          { service: searchRegex },
          { enquiryDetails: searchRegex },
          { comments: searchRegex }
        ]
      };
      
      if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, searchFilter] };
      } else {
        filter = searchFilter;
      }
    }
    
    // Add status filter
    if (status) {
      filter.status = status;
    }

    console.log('📊 Fetching executive enquiries with filter:', filter);

    // Fetch enquiries with pagination - join Visitor and Enquiry tables
    const [enquiries, totalCount] = await Promise.all([
      Enquiry.find(filter)
        .populate('visitorId', 'name email phone organization service source status createdAt')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Enquiry.countDocuments(filter)
    ]);

    console.log(`📊 Found ${enquiries.length} executive enquiries (page ${pageNum}/${Math.ceil(totalCount / limitNum)})`);

    // Transform enquiries data for frontend
    const transformedEnquiries = enquiries.map((enquiry: any) => ({
      _id: enquiry._id.toString(),
      name: enquiry.visitorId?.name || enquiry.visitorName || '',
      email: enquiry.visitorId?.email || enquiry.email || '',
      phone: enquiry.visitorId?.phone || enquiry.phoneNumber || '',
      organization: enquiry.visitorId?.organization || '',
      service: enquiry.visitorId?.service || 'General Inquiry',
      enquiryType: enquiry.enquiryType || 'chatbot',
      enquiryDetails: enquiry.enquiryDetails || '',
      status: enquiry.status || 'new',
      priority: enquiry.priority || 'medium',
      createdAt: enquiry.createdAt,
      lastInteractionAt: enquiry.visitorId?.lastInteractionAt || enquiry.createdAt,
      isConverted: enquiry.visitorId?.isConverted || false,
      customerExecutive: enquiry.customerExecutive || null,
      salesExecutive: enquiry.salesExecutive || null,
      assignedAgent: enquiry.assignedAgent || null,
      comments: enquiry.comments || '',
      amount: enquiry.amount || 0,
      source: enquiry.visitorId?.source || 'chatbot'
    }));

    const response = NextResponse.json({
      success: true,
      enquiries: transformedEnquiries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Executive enquiries management API error:', error);
    const response = NextResponse.json({
      success: false,
      message: 'Failed to load executive enquiries',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}

// Real database implementation
export const GET = async (request: NextRequest) => {
  try {
    console.log('🔄 GET /api/analytics/executive-enquiries-management - Fetching real data');
    
    // Try to connect to MongoDB first
    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB successfully');
      
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const executiveId = searchParams.get('executiveId') || '';

      const pageNum = Math.max(page, 1);
      const limitNum = Math.min(Math.max(limit, 1), 200);

      // Build filter for enquiries
      let filter: any = {};
      
      // Filter by executive if provided
      if (executiveId) {
        filter.$or = [
          { customerExecutive: executiveId },
          { salesExecutive: executiveId },
          { assignedAgent: executiveId }
        ];
      }
      
      // Add search filters
      if (search) {
        const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const searchFilter = {
          $or: [
            { visitorName: searchRegex },
            { email: searchRegex },
            { phoneNumber: searchRegex },
            { enquiryDetails: searchRegex },
            { comments: searchRegex }
          ]
        };
        
        if (Object.keys(filter).length > 0) {
          filter = { $and: [filter, searchFilter] };
        } else {
          filter = searchFilter;
        }
      }
      
      // Add status filter
      if (status) {
        filter.status = status;
      }

      console.log('📊 Fetching enquiries with filter:', filter);

      // Fetch enquiries from database
      const [enquiries, totalCount] = await Promise.all([
        Enquiry.find(filter)
          .populate('visitorId', 'name email phone organization service source status createdAt')
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Enquiry.countDocuments(filter)
      ]);

      console.log(`📊 Found ${enquiries.length} enquiries from database (page ${pageNum}/${Math.ceil(totalCount / limitNum)})`);

      // Transform enquiries data for frontend
      const transformedEnquiries = enquiries.map((enquiry: any) => ({
        _id: enquiry._id.toString(),
        name: enquiry.visitorId?.name || enquiry.visitorName || '',
        email: enquiry.visitorId?.email || enquiry.email || '',
        phone: enquiry.visitorId?.phone || enquiry.phoneNumber || '',
        organization: enquiry.visitorId?.organization || '',
        service: enquiry.visitorId?.service || 'General Inquiry',
        enquiryType: enquiry.enquiryType || 'chatbot',
        enquiryDetails: enquiry.enquiryDetails || '',
        status: enquiry.status || 'new',
        priority: enquiry.priority || 'medium',
        createdAt: enquiry.createdAt,
        lastInteractionAt: enquiry.visitorId?.lastInteractionAt || enquiry.createdAt,
        isConverted: enquiry.visitorId?.isConverted || false,
        customerExecutive: enquiry.customerExecutive || null,
        salesExecutive: enquiry.salesExecutive || null,
        assignedAgent: enquiry.assignedAgent || enquiry.agentName || null,
        agentName: enquiry.agentName || enquiry.assignedAgent || null,
        comments: enquiry.comments || '',
        amount: enquiry.amount || 0,
        source: enquiry.visitorId?.source || 'chatbot'
      }));

      const response = NextResponse.json({
        success: true,
        enquiries: transformedEnquiries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        },
        message: 'Data fetched from database successfully'
      });
      
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;

    } catch (mongoError) {
      console.log('⚠️ MongoDB connection failed, trying memory storage fallback');
      
      // Fallback to memory storage when MongoDB is not available
      const memoryStorage = MemoryStorage.getInstance();
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const search = searchParams.get('search') || '';
      
      const filter: any = {};
      if (search) {
        filter.search = search;
      }
      
      const { enquiries, count } = memoryStorage.getEnquiries(filter, page, limit);
      
      console.log('📊 Memory storage enquiries retrieved:', enquiries.length);
      
      // Transform enquiries data for frontend
      const transformedEnquiries = enquiries.map((enquiry: any) => ({
        _id: enquiry._id.toString(),
        name: enquiry.visitorId?.name || enquiry.visitorName || '',
        email: enquiry.visitorId?.email || enquiry.email || '',
        phone: enquiry.visitorId?.phone || enquiry.phoneNumber || '',
        organization: enquiry.visitorId?.organization || '',
        service: enquiry.visitorId?.service || 'General Inquiry',
        enquiryType: enquiry.enquiryType || 'chatbot',
        enquiryDetails: enquiry.enquiryDetails || '',
        status: enquiry.status || 'new',
        priority: enquiry.priority || 'medium',
        createdAt: enquiry.createdAt,
        lastInteractionAt: enquiry.visitorId?.lastInteractionAt || enquiry.createdAt,
        isConverted: enquiry.visitorId?.isConverted || false,
        customerExecutive: enquiry.customerExecutive || null,
        salesExecutive: enquiry.salesExecutive || null,
        assignedAgent: enquiry.assignedAgent || enquiry.agentName || null,
        agentName: enquiry.agentName || enquiry.assignedAgent || null,
        comments: enquiry.comments || '',
        amount: enquiry.amount || 0,
        source: enquiry.visitorId?.source || 'chatbot'
      }));
      
      const response = NextResponse.json({
        success: true,
        enquiries: transformedEnquiries,
        count: count,
        message: 'Data from memory storage - MongoDB unavailable'
      });
      
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    }

  } catch (error) {
    console.error('❌ Executive enquiries management API error:', error);
    const response = NextResponse.json({
      success: false,
      message: 'Failed to load executive enquiries',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
};
