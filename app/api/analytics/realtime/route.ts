import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import ChatMessage from '@/lib/models/ChatMessage';

// Real-time analytics endpoint
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Real-time Analytics API: Fetching live data...');
    await connectMongo();

    // Get current timestamp for cache busting
    const timestamp = new Date().toISOString();

    // Fetch all analytics data in parallel
    const [
      dailyVisitorsData,
      conversionData,
      recentConversationsData,
      totalVisitors,
      totalEnquiries,
      totalMessages
    ] = await Promise.all([
      getDailyVisitorsData(),
      getConversionRateData(),
      getRecentConversationsData(),
      getTotalVisitors(),
      getTotalEnquiries(),
      getTotalMessages()
    ]);

    const analyticsData = {
      dailyVisitors: dailyVisitorsData,
      conversionRate: conversionData,
      recentConversations: recentConversationsData,
      totals: {
        visitors: totalVisitors,
        enquiries: totalEnquiries,
        messages: totalMessages
      },
      lastUpdated: new Date().toISOString(),
      timestamp
    };

    console.log('✅ Real-time Analytics API: Data fetched successfully');
    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('❌ Real-time Analytics API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch real-time analytics data' 
    }, { status: 500 });
  }
}

// Get daily visitors data
async function getDailyVisitorsData() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const dailyData = await Visitor.aggregate([
    {
      $match: {
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
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  const labels = [];
  const data = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    labels.push(dateStr);
    
    const dayData = dailyData.find(d => 
      d._id.year === date.getFullYear() &&
      d._id.month === date.getMonth() + 1 &&
      d._id.day === date.getDate()
    );
    
    data.push(dayData ? dayData.count : 0);
  }

  return {
    labels,
    datasets: [{
      label: 'Daily Visitors',
      data,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    }]
  };
}

// Get conversion rate data
async function getConversionRateData() {
  const totalVisitors = await Visitor.countDocuments();
  const convertedLeads = await Visitor.countDocuments({ isConverted: true });
  const conversionRate = totalVisitors > 0 ? (convertedLeads / totalVisitors) * 100 : 0;

  return {
    visitors: totalVisitors,
    leadsConverted: convertedLeads,
    conversionRate: Math.round(conversionRate * 100) / 100
  };
}

// Get recent conversations data - Show all visitors from past week
async function getRecentConversationsData() {
  // Get date range for past week
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  // Get all visitors from past week with their messages
  const conversations = await Visitor.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $lookup: {
        from: 'chatmessages',
        localField: '_id',
        foreignField: 'visitorId',
        as: 'messages'
      }
    },
    {
      $addFields: {
        messageCount: { $size: '$messages' },
        lastMessageAt: {
          $cond: {
            if: { $gt: [{ $size: '$messages' }, 0] },
            then: { $max: '$messages.timestamp' },
            else: null
          }
        }
      }
    },
    {
      $sort: { 
        lastMessageAt: -1,
        createdAt: -1 
      }
    },
    {
      $limit: 20 // Show up to 20 recent visitors
    }
  ]);

  return conversations.map(conv => ({
    visitor: {
      _id: conv._id,
      name: conv.name,
      email: conv.email,
      phone: conv.phone,
      organization: conv.organization,
      service: conv.service,
      isConverted: conv.isConverted,
      createdAt: conv.createdAt,
      lastInteractionAt: conv.lastMessageAt
    },
    messages: conv.messages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(msg => ({
        content: msg.content,
        timestamp: msg.timestamp,
        sender: msg.sender
      })),
    messageCount: conv.messageCount,
    lastMessageAt: conv.lastMessageAt
  }));
}

// Get total visitors count
async function getTotalVisitors() {
  return await Visitor.countDocuments();
}

// Get total enquiries count
async function getTotalEnquiries() {
  return await Enquiry.countDocuments();
}

// Get total messages count
async function getTotalMessages() {
  return await ChatMessage.countDocuments();
}
