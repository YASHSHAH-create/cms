import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import Visitor from "@/lib/models/Visitor";
import Enquiry from "@/lib/models/Enquiry";
import ChatMessage from "@/lib/models/ChatMessage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectMongo();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 5);

    const visitors = await Visitor.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const ids = visitors.map((v: any) => v._id);

    const [msgCounts, enquiryByVisitor] = await Promise.all([
      ChatMessage.aggregate([
        { $match: { visitorId: { $in: ids } } },
        { $group: { _id: "$visitorId", count: { $sum: 1 } } },
      ]),
      Enquiry.aggregate([
        { $match: { visitorId: { $in: ids } } },
        { $group: { _id: "$visitorId", statuses: { $addToSet: "$status" } } },
      ]),
    ]);

    const msgMap = new Map(msgCounts.map((m: any) => [String(m._id), m.count]));
    const statusMap = new Map(enquiryByVisitor.map((e: any) => [String(e._id), e.statuses]));

    const items = visitors.map((v: any) => ({
      id: String(v._id),
      name: v.name || "Visitor",
      email: v.email,
      phone: v.phone,
      messages: msgMap.get(String(v._id)) ?? 0,
      tags: statusMap.get(String(v._id)) ?? [],
      joinedAt: v.createdAt?.toISOString?.() ?? null,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('Recent conversations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch recent conversations data' }, { status: 500 });
  }
}