import { NextResponse } from "next/server";
import { getClaimsFromRequest } from "@/utils/jwt";
import { connectMongo } from "@/lib/mongo";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  try {
    const claims = await getClaimsFromRequest(req);
    if (!claims) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    await connectMongo();

    if (claims.role === "admin") {
      // Minimal safe profile for admin
      return NextResponse.json({
        id: claims.sub,
        role: "admin",
        name: "Admin",
        email: claims.email,
        avatar: null,
      });
    } else {
      // Executive profile
      const user = await User.findById(claims.sub).lean();
      return NextResponse.json({
        id: claims.sub,
        role: "executive",
        name: user?.name || "Executive",
        email: user?.email || claims.email,
        avatar: user?.avatar || null,
      });
    }
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
