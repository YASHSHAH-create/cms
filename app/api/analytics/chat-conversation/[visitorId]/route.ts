import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import ChatMessage from '@/lib/models/ChatMessage';
import Visitor from '@/lib/models/Visitor';

export async function GET(
  request: NextRequest,
  { params }: { params: { visitorId: string } }
) {
  try {
    console.log('🔄 GET /api/analytics/chat-conversation/[visitorId] - Fetching chat conversation');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const { visitorId } = params;
    
    console.log('📊 Fetching conversation for visitor:', visitorId);

    // Get visitor details
    const visitor = await Visitor.findById(visitorId).lean();
    if (!visitor) {
      console.log('❌ Visitor not found:', visitorId);
      return NextResponse.json({
        success: false,
        message: 'Visitor not found'
      }, { status: 404 });
    }

    // Get chat messages for this visitor
    const messages = await ChatMessage.find({ visitorId })
      .sort({ createdAt: 1, timestamp: 1 })
      .lean();

    console.log(`📊 Found ${messages.length} messages for visitor ${visitorId}`);

    // Transform the data for frontend
    const conversationData = {
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name || 'Anonymous',
        email: visitor.email || '',
        phone: visitor.phone || '',
        organization: visitor.organization || '',
        service: visitor.service || 'General Inquiry',
        source: visitor.source || 'chatbot',
        status: visitor.status || 'enquiry_required',
        createdAt: visitor.createdAt,
        lastInteractionAt: visitor.lastInteractionAt,
        isConverted: visitor.isConverted || false
      },
      messages: messages.map((message: any) => ({
        _id: message._id.toString(),
        visitorId: message.visitorId.toString(),
        sender: message.sender || 'bot',
        message: message.message || message.text || '',
        at: message.at || message.timestamp || message.createdAt
      }))
    };

    return NextResponse.json(conversationData);

  } catch (error) {
    console.error('❌ Chat conversation API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load chat conversation',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

