import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Runs on the Node.js runtime (not Edge) because our auth config pulls in
// bcryptjs and mongoose, which use Node.js-only APIs the Edge runtime
// doesn't support.
export const runtime = "nodejs";

export default auth((req) => {
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  if (isDashboard && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};