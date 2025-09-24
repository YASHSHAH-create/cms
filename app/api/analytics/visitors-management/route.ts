import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdminOrExecutive, getUserContext } from '@/lib/middleware/auth';
import Visitor from '@/lib/models/Visitor';

async function getVisitorsManagement(request: NextRequest, user: any) {
  try {
    await connectMongo();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';

    const pageNum = Math.max(page, 1);
    const limitNum = Math.min(Math.max(limit, 1), 200);

    // Get user context for role-based filtering
    const userContext = getUserContext(user);
    
    // Build base filter from user context
    let filter = { ...userContext.dataFilter } || {};
    
    // Add search filters
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const searchFilter = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { organization: searchRegex },
          { region: searchRegex },
          { service: searchRegex },
          { subservice: searchRegex },
          { agentName: searchRegex },
          { salesExecutiveName: searchRegex },
          { customerExecutiveName: searchRegex },
          { status: searchRegex },
          { enquiryDetails: searchRegex },
          { comments: searchRegex },
          { source: searchRegex }
        ]
      };
      
      // Combine role-based filter with search filter
      if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, searchFilter] };
      } else {
        filter = searchFilter;
      }
    }
    
    // Add additional filters
    if (status) {
      if (filter.$and) {
        filter.$and.push({ status });
      } else if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, { status }] };
      } else {
        filter.status = status;
      }
    }
    
    if (source) {
      if (filter.$and) {
        filter.$and.push({ source });
      } else if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, { source }] };
      } else {
        filter.source = source;
      }
    }

    // Get visitors with pagination
    const [visitors, totalCount] = await Promise.all([
      Visitor.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Visitor.countDocuments(filter)
    ]);

    // Transform visitors data for frontend
    const transformedVisitors = visitors.map(v => ({
      _id: v._id.toString(),
      name: v.name || '',
      email: v.email || '',
      phone: v.phone || '',
      organization: v.organization || '',
      region: v.region || '',
      service: v.service || 'General Inquiry',
      subservice: v.subservice || '',
      enquiryDetails: v.enquiryDetails || '',
      source: v.source || 'chatbot',
      createdAt: v.createdAt,
      lastInteractionAt: v.lastInteractionAt,
      isConverted: v.isConverted || false,
      status: v.status || 'enquiry_required',
      agent: v.agent || '',
      agentName: v.agentName || '',
      assignedAgent: v.assignedAgent || null,
      salesExecutive: v.salesExecutive || null,
      salesExecutiveName: v.salesExecutiveName || '',
      customerExecutive: v.customerExecutive || null,
      customerExecutiveName: v.customerExecutiveName || '',
      comments: v.comments || '',
      amount: v.amount || 0,
      pipelineHistory: v.pipelineHistory || [],
      version: v.version || 1,
      lastModifiedBy: v.lastModifiedBy || '',
      lastModifiedAt: v.lastModifiedAt || v.updatedAt,
      assignmentHistory: v.assignmentHistory || []
    }));

    return NextResponse.json({
      visitors: transformedVisitors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      userContext: {
        role: userContext.userRole,
        canAccessAll: userContext.canAccessAll
      }
    });

  } catch (error) {
    console.error('Analytics visitors management error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to load visitors management data' 
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getVisitorsManagement(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Visitors management API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load visitors management data'
    }, { status: 500 });
  }
};
