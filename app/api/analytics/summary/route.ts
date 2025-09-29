import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import Visitor from "@/lib/models/Visitor";
import Enquiry from "@/lib/models/Enquiry";
import ChatMessage from "@/lib/models/ChatMessage";
import { normalizeStatus } from "@/lib/normalize";
import { isLeadStatus, isPendingStatus } from "@/lib/statusConfig";

export const dynamic = "force-dynamic";

/** Build tolerant query: match by normalized regex list */
function regexFromSet(set: Set<string>) {
  return { $in: Array.from(set).map(v => new RegExp(`^${v}$`, "i")) };
}

export async function GET() {
  try {
    await connectMongo();

    // Prefer explicit status field but also tolerate alt names
    const statusFields = ["status","state","stage","enquiryStatus"];

    // Import status sets
    const { LEAD_SET, PENDING_SET } = await import("@/lib/statusConfig");
    
    // Compute leads/pending with an $or across possible status fields
    const leadOr = statusFields.map(f => ({ [f]: regexFromSet(LEAD_SET) }));
    const pendOr = statusFields.map(f => ({ [f]: regexFromSet(PENDING_SET) }));

    const [totalVisitors, leadsByStatus, pendingByStatus, chatbotVisitorIds] = await Promise.all([
      Visitor.countDocuments({}),
      Enquiry.countDocuments({ $or: leadOr }),
      ChatMessage.distinct("visitorId"),
      Enquiry.countDocuments({ $or: pendOr }),
    ]);

    // Additional fallbacks (in case teams use booleans/dates instead of strings)
    const [leadsByFlags] = await Promise.all([
      Enquiry.countDocuments({
        $or: [
          { isConverted: true },
          { converted: true },
          { convertedAt: { $exists: true, $ne: null } },
          { result: /won|converted|success/i },
          { disposition: /won|converted|interested|booked/i },
        ],
      }),
    ]);

    const leads = Math.max(Number(leadsByStatus) || 0, Number(leadsByFlags) || 0);
    const pendingConversations = Number(pendingByStatus) || 0;

    const tot = Number(totalVisitors) || 0;
    const conversionRate = tot > 0 ? Math.round((leads / tot) * 100) : 0;

    return NextResponse.json({
      totalVisitors: tot,
      leads,
      chatbotEnquiries: Array.isArray(chatbotVisitorIds) ? chatbotVisitorIds.length : 0,
      pendingConversations,
      conversionRate, // integer 0..100
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json({ error: 'Failed to fetch summary data' }, { status: 500 });
  }
}
