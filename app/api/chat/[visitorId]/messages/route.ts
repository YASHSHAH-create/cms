import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import ChatMessage from '@/lib/models/ChatMessage';

// POST /api/chat/[visitorId]/messages - Create chat message
export async function POST(
  request: NextRequest,
  { params }: { params: { visitorId: string } }
) {
  try {
    await connectMongo();
    
    const { visitorId } = params;
    const { sender, message } = await request.json();

    if (!sender || !['user', 'bot'].includes(sender) || !message) {
      return NextResponse.json({ 
        ok: false, 
        message: 'sender and message are required' 
      }, { status: 400 });
    }

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Visitor not found' 
      }, { status: 404 });
    }

    // Create chat message
    await ChatMessage.create({ 
      visitorId, 
      sender, 
      message, 
      at: new Date() 
    });

    // Update visitor's last interaction
    visitor.lastInteractionAt = new Date();
    await visitor.save();

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Chat message creation error:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Failed to create chat message' 
    }, { status: 500 });
  }
}

// GET /api/chat/[visitorId]/messages - Get chat messages for visitor
export async function GET(
  request: NextRequest,
  { params }: { params: { visitorId: string } }
) {
  try {
    await connectMongo();
    
    const { visitorId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Visitor not found' 
      }, { status: 404 });
    }

    // Get chat messages for this visitor
    const messages = await ChatMessage.find({ visitorId })
      .sort({ at: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      ok: true,
      messages: messages.map(msg => ({
        _id: msg._id.toString(),
        visitorId: msg.visitorId.toString(),
        sender: msg.sender,
        message: msg.message,
        at: msg.at
      }))
    });

  } catch (error) {
    console.error('Chat messages fetch error:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Failed to fetch chat messages' 
    }, { status: 500 });
  }
}
