import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import Visitor from "@/lib/models/Visitor";
import Enquiry from "@/lib/models/Enquiry";
import ChatMessage from "@/lib/models/ChatMessage";

export const dynamic = "force-dynamic";

// Case-insensitive status sets
const LEAD_STATUSES = ["converted","won","closed_won","lead"];
const PENDING_STATUSES = ["new","open","pending","assigned"];

function ciRegexSet(values: string[]) {
  return { $in: values.map(v => new RegExp(`^${v}$`, "i")) };
}

export async function GET() {
  try {
    await connectMongo();

    const [totalVisitors, leadsAcquired, chatbotVisitorIds, pendingConversations] = await Promise.all([
      Visitor.countDocuments({}),
      Enquiry.countDocuments({ status: ciRegexSet(LEAD_STATUSES) as any }),
      ChatMessage.distinct("visitorId"),
      Enquiry.countDocuments({ status: ciRegexSet(PENDING_STATUSES) as any }),
    ]);

    const tot = Number(totalVisitors) || 0;
    const leads = Number(leadsAcquired) || 0;
    const conversionRate = tot > 0 ? Math.round((leads / tot) * 100) : 0;

    return NextResponse.json({
      totalVisitors: tot,
      leads,
      chatbotEnquiries: Array.isArray(chatbotVisitorIds) ? chatbotVisitorIds.length : 0,
      pendingConversations: Number(pendingConversations) || 0,
      conversionRate, // integer 0..100
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json({ error: 'Failed to fetch summary data' }, { status: 500 });
  }
}
