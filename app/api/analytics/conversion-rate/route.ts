import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdminOrExecutive, getUserContext } from '@/lib/middleware/auth';
import Visitor from '@/lib/models/Visitor';

async function getConversionRateData(request: NextRequest, user: any) {
  try {
    await connectMongo();

    const userContext = getUserContext(user);
    const baseFilter = userContext.dataFilter || {};

    // Get last 7 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Aggregate conversion data by day
    const conversionData = await Visitor.aggregate([
      {
        $match: {
          ...baseFilter,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          total: { $sum: 1 },
          converted: { $sum: { $cond: ['$isConverted', 1, 0] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format data for chart
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      labels.push(dateStr);
      
      const dayData = conversionData.find(d => 
        d._id.year === date.getFullYear() &&
        d._id.month === date.getMonth() + 1 &&
        d._id.day === date.getDate()
      );
      
      if (dayData && dayData.total > 0) {
        const rate = (dayData.converted / dayData.total) * 100;
        data.push(Math.round(rate * 10) / 10); // Round to 1 decimal
      } else {
        data.push(0);
      }
    }

    return NextResponse.json({
      labels,
      datasets: [{
        label: 'Conversion Rate (%)',
        data,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }]
    });

  } catch (error) {
    console.error('Conversion rate analytics error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to load conversion rate data' 
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getConversionRateData(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Conversion rate API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load conversion rate data'
    }, { status: 500 });
  }
};
