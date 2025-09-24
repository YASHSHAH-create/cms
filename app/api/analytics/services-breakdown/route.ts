import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function getServicesBreakdownData(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/analytics/services-breakdown - Fetching services breakdown data');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get services breakdown
    const servicesBreakdown = await Visitor.aggregate([
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          converted: { $sum: { $cond: ['$isConverted', 1, 0] } },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$converted', '$count'] },
              100
            ]
          },
          avgAmount: {
            $divide: ['$totalAmount', '$count']
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get subservices breakdown
    const subservicesBreakdown = await Visitor.aggregate([
      {
        $match: {
          subservice: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$subservice',
          count: { $sum: 1 },
          converted: { $sum: { $cond: ['$isConverted', 1, 0] } },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$converted', '$count'] },
              100
            ]
          },
          avgAmount: {
            $divide: ['$totalAmount', '$count']
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get services by source
    const servicesBySource = await Visitor.aggregate([
      {
        $group: {
          _id: {
            service: '$service',
            source: '$source'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          sources: {
            $push: {
              source: '$_id.source',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      {
        $sort: { totalCount: -1 }
      }
    ]);

    // Get services by region
    const servicesByRegion = await Visitor.aggregate([
      {
        $group: {
          _id: {
            service: '$service',
            region: '$region'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          regions: {
            $push: {
              region: '$_id.region',
              count: '$count'
            }
          },
          totalCount: { $sum: '$count' }
        }
      },
      {
        $sort: { totalCount: -1 }
      }
    ]);

    // Get monthly services trends
    const monthlyServicesTrends = await Visitor.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            service: '$service',
            month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
          },
          count: { $sum: 1 },
          converted: { $sum: { $cond: ['$isConverted', 1, 0] } }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          monthlyData: {
            $push: {
              month: '$_id.month',
              count: '$count',
              converted: '$converted'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get service performance metrics
    const servicePerformance = await Visitor.aggregate([
      {
        $group: {
          _id: '$service',
          totalVisitors: { $sum: 1 },
          convertedVisitors: { $sum: { $cond: ['$isConverted', 1, 0] } },
          totalRevenue: { $sum: '$amount' },
          avgRevenue: { $avg: '$amount' },
          minRevenue: { $min: '$amount' },
          maxRevenue: { $max: '$amount' }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $multiply: [
              { $divide: ['$convertedVisitors', '$totalVisitors'] },
              100
            ]
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    console.log('📊 Generated services breakdown data');

    return NextResponse.json({
      success: true,
      breakdown: {
        services: servicesBreakdown.map(item => ({
          service: item._id || 'Unknown',
          count: item.count,
          converted: item.converted,
          conversionRate: parseFloat(item.conversionRate.toFixed(2)),
          totalAmount: item.totalAmount || 0,
          avgAmount: parseFloat((item.avgAmount || 0).toFixed(2))
        })),
        subservices: subservicesBreakdown.map(item => ({
          subservice: item._id || 'Unknown',
          count: item.count,
          converted: item.converted,
          conversionRate: parseFloat(item.conversionRate.toFixed(2)),
          totalAmount: item.totalAmount || 0,
          avgAmount: parseFloat((item.avgAmount || 0).toFixed(2))
        })),
        bySource: servicesBySource.map(item => ({
          service: item._id || 'Unknown',
          totalCount: item.totalCount,
          sources: item.sources.map((source: any) => ({
            source: source.source || 'Unknown',
            count: source.count
          }))
        })),
        byRegion: servicesByRegion.map(item => ({
          service: item._id || 'Unknown',
          totalCount: item.totalCount,
          regions: item.regions.map((region: any) => ({
            region: region.region || 'Unknown',
            count: region.count
          }))
        })),
        monthlyTrends: monthlyServicesTrends.map(item => ({
          service: item._id || 'Unknown',
          monthlyData: item.monthlyData.map((month: any) => ({
            month: month.month,
            count: month.count,
            converted: month.converted
          }))
        })),
        performance: servicePerformance.map(item => ({
          service: item._id || 'Unknown',
          totalVisitors: item.totalVisitors,
          convertedVisitors: item.convertedVisitors,
          conversionRate: parseFloat(item.conversionRate.toFixed(2)),
          totalRevenue: item.totalRevenue || 0,
          avgRevenue: parseFloat((item.avgRevenue || 0).toFixed(2)),
          minRevenue: item.minRevenue || 0,
          maxRevenue: item.maxRevenue || 0
        }))
      }
    });

  } catch (error) {
    console.error('❌ Services breakdown API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load services breakdown data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getServicesBreakdownData(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Services breakdown API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load services breakdown data'
    }, { status: 500 });
  }
};
