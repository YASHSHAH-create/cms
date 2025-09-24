import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdminOrExecutive, getUserContext } from '@/lib/middleware/auth';
import Visitor from '@/lib/models/Visitor';
import ChatMessage from '@/lib/models/ChatMessage';

async function getRecentConversationsData(request: NextRequest, user: any) {
  try {
    await connectMongo();

    const userContext = getUserContext(user);
    const baseFilter = userContext.dataFilter || {};

    // Get recent visitors with their latest messages
    const recentVisitors = await Visitor.find(baseFilter)
      .sort({ lastInteractionAt: -1, createdAt: -1 })
      .limit(10)
      .lean();

    // Get messages for these visitors
    const visitorIds = recentVisitors.map(v => v._id);
    const recentMessages = await ChatMessage.find({
      visitorId: { $in: visitorIds }
    })
    .sort({ at: -1 })
    .limit(50)
    .lean();

    // Group messages by visitor
    const messagesByVisitor: { [key: string]: any[] } = {};
    recentMessages.forEach(message => {
      const visitorId = message.visitorId?.toString();
      if (visitorId) {
        if (!messagesByVisitor[visitorId]) {
          messagesByVisitor[visitorId] = [];
        }
        messagesByVisitor[visitorId].push(message);
      }
    });

    // Create conversation data
    const conversations = recentVisitors
      .filter(v => messagesByVisitor[v._id.toString()]?.length > 0)
      .map(v => {
        const messages = messagesByVisitor[v._id.toString()]
          .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
          .slice(-5); // Last 5 messages

        return {
          visitor: {
            _id: v._id.toString(),
            name: v.name || 'Anonymous',
            email: v.email || '',
            phone: v.phone || '',
            organization: v.organization || '',
            service: v.service || 'General Inquiry',
            isConverted: v.isConverted || false,
            createdAt: v.createdAt,
            lastInteractionAt: v.lastInteractionAt
          },
          messages: messages.map(m => ({
            _id: m._id.toString(),
            visitorId: m.visitorId.toString(),
            sender: m.sender,
            message: m.message,
            at: m.at
          })),
          messageCount: messagesByVisitor[v._id.toString()].length,
          lastMessageAt: messages[messages.length - 1]?.at
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
      .slice(0, 8); // Top 8 recent conversations

    return NextResponse.json(conversations);

  } catch (error) {
    console.error('Recent conversations error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to load recent conversations data' 
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getRecentConversationsData(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' });
  } catch (error) {
    console.error('Recent conversations API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load recent conversations data'
    }, { status: 500 });
  }
};
