import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import ChatMessage from '@/lib/models/ChatMessage';
import Visitor from '@/lib/models/Visitor';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function getConversationsOverviewData(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/analytics/conversations-overview - Fetching conversations overview data');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Get total conversations and messages
    const totalMessages = await ChatMessage.countDocuments();
    const totalConversations = await Visitor.countDocuments();

    // Get conversations with messages
    const conversationsWithMessages = await ChatMessage.aggregate([
      {
        $group: {
          _id: '$visitorId',
          messageCount: { $sum: 1 },
          lastMessage: { $max: '$timestamp' },
          firstMessage: { $min: '$timestamp' }
        }
      },
      {
        $count: 'total'
      }
    ]);

    // Get average messages per conversation
    const avgMessagesPerConversation = conversationsWithMessages.length > 0 
      ? totalMessages / conversationsWithMessages[0].total 
      : 0;

    // Get daily conversation trends
    const dailyConversations = await ChatMessage.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          messageCount: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' }
        }
      },
      {
        $addFields: {
          uniqueVisitorCount: { $size: '$uniqueVisitors' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get hourly conversation patterns
    const hourlyConversations = await ChatMessage.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          messageCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get conversation length distribution
    const conversationLengths = await ChatMessage.aggregate([
      {
        $group: {
          _id: '$visitorId',
          messageCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ['$messageCount', 1] }, then: '1 message' },
                { case: { $lte: ['$messageCount', 5] }, then: '2-5 messages' },
                { case: { $lte: ['$messageCount', 10] }, then: '6-10 messages' },
                { case: { $lte: ['$messageCount', 20] }, then: '11-20 messages' }
              ],
              default: '20+ messages'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get response time analysis
    const responseTimeAnalysis = await ChatMessage.aggregate([
      {
        $match: {
          sender: 'bot'
        }
      },
      {
        $lookup: {
          from: 'chatmessages',
          let: { visitorId: '$visitorId', timestamp: '$timestamp' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$visitorId', '$$visitorId'] },
                    { $lt: ['$timestamp', '$$timestamp'] },
                    { $eq: ['$sender', 'user'] }
                  ]
                }
              }
            },
            {
              $sort: { timestamp: -1 }
            },
            {
              $limit: 1
            }
          ],
          as: 'previousUserMessage'
        }
      },
      {
        $match: {
          'previousUserMessage.0': { $exists: true }
        }
      },
      {
        $addFields: {
          responseTime: {
            $divide: [
              { $subtract: ['$timestamp', '$previousUserMessage.0.timestamp'] },
              1000 // Convert to seconds
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);

    // Get conversation outcomes
    const conversationOutcomes = await Visitor.aggregate([
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
          hasMessages: { $gt: [{ $size: '$messages' }, 0] }
        }
      },
      {
        $group: {
          _id: {
            hasMessages: '$hasMessages',
            isConverted: '$isConverted'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 Generated conversations overview data');

    return NextResponse.json({
      success: true,
      overview: {
        totals: {
          totalMessages,
          totalConversations,
          conversationsWithMessages: conversationsWithMessages.length > 0 ? conversationsWithMessages[0].total : 0,
          avgMessagesPerConversation: parseFloat(avgMessagesPerConversation.toFixed(2))
        },
        dailyTrends: dailyConversations.map(item => ({
          date: item._id,
          messageCount: item.messageCount,
          uniqueVisitors: item.uniqueVisitorCount
        })),
        hourlyPatterns: hourlyConversations.map(item => ({
          hour: item._id,
          messageCount: item.messageCount
        })),
        conversationLengths: conversationLengths.map(item => ({
          length: item._id,
          count: item.count
        })),
        responseTime: responseTimeAnalysis.length > 0 ? {
          average: parseFloat(responseTimeAnalysis[0].avgResponseTime.toFixed(2)),
          minimum: parseFloat(responseTimeAnalysis[0].minResponseTime.toFixed(2)),
          maximum: parseFloat(responseTimeAnalysis[0].maxResponseTime.toFixed(2))
        } : null,
        outcomes: conversationOutcomes.map(item => ({
          hasMessages: item._id.hasMessages,
          isConverted: item._id.isConverted,
          count: item.count
        }))
      }
    });

  } catch (error) {
    console.error('❌ Conversations overview API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load conversations overview data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getConversationsOverviewData(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Conversations overview API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load conversations overview data'
    }, { status: 500 });
  }
};
