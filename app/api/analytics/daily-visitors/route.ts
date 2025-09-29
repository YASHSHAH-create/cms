import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import Visitor from "@/lib/models/Visitor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongo();

    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const series = await Visitor.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          visitors: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const days: string[] = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    const map = new Map(series.map((r: any) => [r._id, r.visitors]));
    const data = days.map((d) => ({ date: d, visitors: map.get(d) ?? 0 }));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Daily visitors API error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily visitors data' }, { status: 500 });
  }
}