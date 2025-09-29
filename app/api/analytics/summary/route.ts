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
      ChatMessage.distinct("visitorId"), // count distinct visitors who chatted
      Enquiry.countDocuments({ status: { $in: PENDING_STATUSES } }),
    ]);

    const chatbotEnquiries = Array.isArray(chatbotVisitorIds) ? chatbotVisitorIds.length : 0;
    const conversionRate = totalVisitors > 0 ? (leadsAcquired / totalVisitors) * 100 : 0;

    return NextResponse.json({
      totalVisitors,
      leads: leadsAcquired,
      chatbotEnquiries,
      pendingConversations,
      conversionRate,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json({ error: 'Failed to fetch summary data' }, { status: 500 });
  }
}
