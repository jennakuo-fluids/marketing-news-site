import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Protects every route except the sign-in page itself, static assets, and
// the cron revalidate route (which has its own header-secret check — see
// app/api/cron/revalidate/route.ts and handover §3, §15).
const PUBLIC_PATHS = ["/signin", "/api/cron/revalidate"];

// Files served directly out of /public (logos, icons, …) — the matcher
// below already excludes _next/static, _next/image and favicon.ico, but
// anything else under /public (e.g. /logo-fluids.png, referenced by the
// sign-in page itself) still hit the gate and bounced back to /signin in
// a redirect loop, since a static <img> request carries no session cookie.
const STATIC_ASSET_RE = /\.(png|jpe?g|svg|webp|gif|ico|css|js|map|txt|woff2?|ttf)$/i;

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    STATIC_ASSET_RE.test(pathname)
  );
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const signInUrl = new URL("/signin", req.nextUrl.origin);
  signInUrl.searchParams.set("returnTo", pathname + req.nextUrl.search);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
