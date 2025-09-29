import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import ChatMessage from "@/lib/models/ChatMessage";
import Visitor from "@/lib/models/Visitor";
import { addEventDateStage } from "@/lib/mongoDate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await connectMongo();
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 5);

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const pipeline: any[] = [
      ...addEventDateStage(),
      { $match: { eventDate: { $gte: since } } },
      { $group: { _id: "$visitorId", lastAt: { $max: "$eventDate" }, count: { $sum: 1 } } },
      { $sort: { lastAt: -1 } },
      { $limit: limit }
    ];

    const rows = await ChatMessage.aggregate(pipeline);

    const ids = rows.map((r: any) => r._id).filter(Boolean);
    const visitors = await Visitor.find({ _id: { $in: ids } }).lean();
    const vMap = new Map(visitors.map((v: any) => [String(v._id), v]));

    const items = rows.map((r: any) => {
      const v = vMap.get(String(r._id));
      return {
        id: String(r._id),
        name: v?.name || "Visitor",
        email: v?.email,
        phone: v?.phone,
        messages: r.count || 0,
        lastAt: r.lastAt ? new Date(r.lastAt).toISOString() : null
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Active conversations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch active conversations data' }, { status: 500 });
  }
}
