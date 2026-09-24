import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { timingSafeEqualStrings } from "@/lib/session";

// Called by an external n8n workflow every 5 minutes (handover §3, §18) —
// not Vercel Cron. The secret travels as a header, never the query string,
// so it can't end up in logs or browser history. This route is excluded
// from the password-gate middleware; this header check is its own gate.
export async function POST(req: NextRequest) {
  const provided = req.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET ?? "";

  if (!expected || !provided || !timingSafeEqualStrings(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  revalidateTag("ragic");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
