import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongo";
import Enquiry from "@/lib/models/Enquiry";
import { normalizeStatus } from "@/lib/normalize";
import { LEAD_SET, PENDING_SET } from "@/lib/statusConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongo();

    // Collect candidates from multiple fields
    const rows = await Enquiry.aggregate([
      {
        $project: {
          status: 1, state: 1, stage: 1, enquiryStatus: 1,
        }
      },
      {
        $project: {
          raw: {
            $ifNull: [
              "$status",
              { $ifNull: ["$state", { $ifNull: ["$stage", "$enquiryStatus"] }] }
            ]
          }
        }
      },
      {
        $group: {
          _id: { $toLower: { $trim: { input: { $toString: "$raw" } } } },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const list = rows.map(r => ({
      value: r._id || "",
      normalized: normalizeStatus(r._id || ""),
      count: r.count,
      leadMapped: LEAD_SET.has(normalizeStatus(r._id || "")),
      pendingMapped: PENDING_SET.has(normalizeStatus(r._id || "")),
    }));

    return NextResponse.json({ totalDistinct: list.length, list });
  } catch (error) {
    console.error('Debug enquiry statuses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch debug data' }, { status: 500 });
  }
}
