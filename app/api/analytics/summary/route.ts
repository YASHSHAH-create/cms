import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import Visitor from "@/lib/models/Visitor";
import Enquiry from "@/lib/models/Enquiry";
import ChatMessage from "@/lib/models/ChatMessage";

export const dynamic = "force-dynamic";

const LEAD_STATUSES = ["converted", "won", "closed_won", "lead"];
const PENDING_STATUSES = ["new", "open", "pending", "assigned"];

export async function GET() {
  try {
    await connectMongo();

    const [totalVisitors, leadsAcquired, chatbotVisitorIds, pendingConversations] = await Promise.all([
      Visitor.countDocuments({}),
      Enquiry.countDocuments({ status: { $in: LEAD_STATUSES } }),
      ChatMessage.distinct("visitorId"),
      Enquiry.countDocuments({ status: { $in: PENDING_STATUSES } }),
    ]);

    const conversionRate =
      totalVisitors > 0 ? Math.round((Number(leadsAcquired) / Number(totalVisitors)) * 100) : 0;

    return NextResponse.json({
      totalVisitors: Number(totalVisitors) || 0,
      leads: Number(leadsAcquired) || 0,
      chatbotEnquiries: Array.isArray(chatbotVisitorIds) ? chatbotVisitorIds.length : 0,
      pendingConversations: Number(pendingConversations) || 0,
      conversionRate, // integer percent 0..100
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json({ error: 'Failed to fetch summary data' }, { status: 500 });
  }
}
