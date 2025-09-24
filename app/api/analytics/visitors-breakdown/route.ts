import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function getVisitorsBreakdownData(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/analytics/visitors-breakdown - Fetching visitors breakdown data');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get visitors breakdown by source
    const sourceBreakdown = await Visitor.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get visitors breakdown by service
    const serviceBreakdown = await Visitor.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get visitors breakdown by status
    const statusBreakdown = await Visitor.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get visitors breakdown by region
    const regionBreakdown = await Visitor.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get conversion rate by source
    const conversionBySource = await Visitor.aggregate([
      {
        $group: {
          _id: '$source',
          total: { $sum: 1 },
          converted: { $sum: { $cond: ['$isConverted', 1, 0] } }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$converted', '$total'] },
              100
            ]
          }
        }
      },
      {
        $sort: { conversionRate: -1 }
      }
    ]);

    console.log('📊 Generated visitors breakdown data');

    return NextResponse.json({
      success: true,
      breakdown: {
        bySource: sourceBreakdown.map(item => ({
          source: item._id || 'Unknown',
          count: item.count
        })),
        byService: serviceBreakdown.map(item => ({
          service: item._id || 'Unknown',
          count: item.count
        })),
        byStatus: statusBreakdown.map(item => ({
          status: item._id || 'Unknown',
          count: item.count
        })),
        byRegion: regionBreakdown.map(item => ({
          region: item._id || 'Unknown',
          count: item.count
        })),
        conversionBySource: conversionBySource.map(item => ({
          source: item._id || 'Unknown',
          total: item.total,
          converted: item.converted,
          conversionRate: parseFloat(item.conversionRate.toFixed(2))
        }))
      }
    });

  } catch (error) {
    console.error('❌ Visitors breakdown API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load visitors breakdown data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getVisitorsBreakdownData(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Visitors breakdown API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load visitors breakdown data'
    }, { status: 500 });
  }
};
