import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/test-database - Testing database collections');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get counts from all collections
    const visitorCount = await Visitor.countDocuments();
    const enquiryCount = await Enquiry.countDocuments();
    
    // Get recent data
    const recentVisitors = await Visitor.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email phone createdAt')
      .lean();
      
    const recentEnquiries = await Enquiry.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('visitorName email phoneNumber enquiryDetails createdAt')
      .lean();

    console.log('📊 Database stats:', {
      visitors: visitorCount,
      enquiries: enquiryCount
    });

    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      data: {
        collections: {
          visitors: {
            count: visitorCount,
            recent: recentVisitors
          },
          enquiries: {
            count: enquiryCount,
            recent: recentEnquiries
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
