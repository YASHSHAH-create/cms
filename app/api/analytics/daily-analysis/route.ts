import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdminOrExecutive, getUserContext } from '@/lib/middleware/auth';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import ChatMessage from '@/lib/models/ChatMessage';

async function getDailyAnalysisData(request: NextRequest, user: any) {
  try {
    await connectMongo();

    const userContext = getUserContext(user);
    const baseFilter = userContext.dataFilter || {};

    // Get last 7 days of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // Get daily analysis data
    const dailyAnalysis = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const [visitors, enquiries, messages] = await Promise.all([
        Visitor.countDocuments({
          ...baseFilter,
          createdAt: { $gte: dayStart, $lte: dayEnd }
        }),
        Enquiry.countDocuments({
          ...baseFilter,
          createdAt: { $gte: dayStart, $lte: dayEnd }
        }),
        ChatMessage.countDocuments({
          at: { $gte: dayStart, $lte: dayEnd }
        })
      ]);

      dailyAnalysis.push({
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        visitors,
        enquiries,
        messages,
        conversionRate: visitors > 0 ? Math.round((enquiries / visitors) * 100 * 10) / 10 : 0
      });
    }

    return NextResponse.json(dailyAnalysis);

  } catch (error) {
    console.error('Daily analysis error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to load daily analysis data' 
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getDailyAnalysisData(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Daily analysis API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load daily analysis data'
    }, { status: 500 });
  }
};
