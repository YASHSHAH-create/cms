import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwt } from "@/utils/jwt";

const adminPaths = ["/dashboard/admin"];
const execPaths = ["/dashboard/executive"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Only guard dashboard routes
  if (!url.startsWith("/dashboard")) return NextResponse.next();

  const token = req.cookies.get("access_token")?.value;
  const claims = token ? verifyJwt(token) : null;

  if (!claims) return NextResponse.redirect(new URL("/login", req.url));

  // Role checks
  if (adminPaths.some(p => url.startsWith(p)) && claims.role !== "admin") {
    return NextResponse.redirect(new URL("/403", req.url));
  }
  if (execPaths.some(p => url.startsWith(p)) && claims.role !== "executive") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
