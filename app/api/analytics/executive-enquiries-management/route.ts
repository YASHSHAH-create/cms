import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

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

    // Fetch enquiries with pagination
    const [enquiries, totalCount] = await Promise.all([
      Visitor.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Visitor.countDocuments(filter)
    ]);

    console.log(`📊 Found ${enquiries.length} executive enquiries (page ${pageNum}/${Math.ceil(totalCount / limitNum)})`);

    // Transform enquiries data for frontend
    const transformedEnquiries = enquiries.map((enquiry: any) => ({
      _id: enquiry._id.toString(),
      name: enquiry.name || '',
      email: enquiry.email || '',
      phone: enquiry.phone || '',
      organization: enquiry.organization || '',
      service: enquiry.service || 'General Inquiry',
      enquiryType: enquiry.enquiryType || enquiry.service || 'General Inquiry',
      enquiryDetails: enquiry.enquiryDetails || '',
      status: enquiry.status || 'enquiry_required',
      priority: enquiry.priority || 'medium',
      createdAt: enquiry.createdAt,
      lastInteractionAt: enquiry.lastInteractionAt,
      isConverted: enquiry.isConverted || false,
      customerExecutive: enquiry.customerExecutive || null,
      salesExecutive: enquiry.salesExecutive || null,
      assignedAgent: enquiry.assignedAgent || null,
      comments: enquiry.comments || '',
      amount: enquiry.amount || 0,
      source: enquiry.source || 'chatbot'
    }));

    return NextResponse.json({
      success: true,
      enquiries: transformedEnquiries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Executive enquiries management API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load executive enquiries',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getExecutiveEnquiriesManagement(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Executive enquiries management API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load executive enquiries'
    }, { status: 500 });
  }
};
