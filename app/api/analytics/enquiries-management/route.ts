import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function getEnquiriesManagementData(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/analytics/enquiries-management - Fetching enquiries management data');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';

    const pageNum = Math.max(page, 1);
    const limitNum = Math.min(Math.max(limit, 1), 200);

    // Build filter
    let filter: any = {};
    
    // Add search filters
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { organization: searchRegex },
        { service: searchRegex },
        { enquiryDetails: searchRegex },
        { comments: searchRegex }
      ];
    }
    
    // Add additional filters
    if (status) {
      filter.status = status;
    }
    if (source) {
      filter.source = source;
    }

    console.log('📊 Fetching enquiries with filter:', filter);

    // Fetch enquiries with pagination
    const [enquiries, totalCount] = await Promise.all([
      Visitor.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Visitor.countDocuments(filter)
    ]);

    console.log(`📊 Found ${enquiries.length} enquiries (page ${pageNum}/${Math.ceil(totalCount / limitNum)})`);

    // Transform enquiries data for frontend
    const transformedEnquiries = enquiries.map((enquiry: any) => ({
      _id: enquiry._id.toString(),
      visitorName: enquiry.name || 'Unknown',
      phoneNumber: enquiry.phone || '',
      email: enquiry.email || '',
      enquiryType: (['chatbot','email','calls','website'].includes(enquiry.source) ? enquiry.source : 'chatbot') as any,
      enquiryDetails: enquiry.enquiryDetails || 'General enquiry',
      createdAt: enquiry.createdAt,
      status: enquiry.status || 'new',
      assignedAgent: enquiry.agentName || enquiry.agent || 'Unassigned',
      service: enquiry.service || 'General Inquiry',
      subservice: enquiry.subservice || '',
      organization: enquiry.organization || '',
      region: enquiry.region || '',
      salesExecutive: enquiry.salesExecutiveName || enquiry.salesExecutive || '',
      comments: enquiry.comments || '',
      amount: enquiry.amount || 0,
      source: enquiry.source || 'chatbot',
      isConverted: enquiry.isConverted || false,
      lastInteractionAt: enquiry.lastInteractionAt
    }));

    // Get enquiry statistics
    const enquiryStats = await Visitor.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          },
          bySource: {
            $push: {
              source: '$source',
              count: 1
            }
          },
          byService: {
            $push: {
              service: '$service',
              count: 1
            }
          }
        }
      }
    ]);

    // Process statistics
    const stats = {
      total: totalCount,
      byStatus: {} as any,
      bySource: {} as any,
      byService: {} as any
    };

    if (enquiryStats.length > 0) {
      const stat = enquiryStats[0];
      
      // Count by status
      stat.byStatus.forEach((item: any) => {
        const status = item.status || 'Unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });
      
      // Count by source
      stat.bySource.forEach((item: any) => {
        const source = item.source || 'Unknown';
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      });
      
      // Count by service
      stat.byService.forEach((item: any) => {
        const service = item.service || 'Unknown';
        stats.byService[service] = (stats.byService[service] || 0) + 1;
      });
    }

    return NextResponse.json({
      success: true,
      enquiries: transformedEnquiries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      stats
    });

  } catch (error) {
    console.error('❌ Enquiries management API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load enquiries management data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getEnquiriesManagementData(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Enquiries management API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load enquiries management data'
    }, { status: 500 });
  }
};
