import { LandingContent } from "@/components/LandingContent";
import { getRecords } from "@/lib/get-records";

// Without this, Next tries to statically optimize "/" at build time, which
// means the top bar's SearchBox (useSearchParams, behind a Suspense
// boundary in AppShell) gets prerendered showing only its fallback, then
// swapped for real content on hydration — a legitimate Suspense handoff,
// but Turbopack's dev SSR doesn't emit the boundary markers this needs, so
// it surfaces as a hydration-mismatch error. /search and /news/[id] never
// hit this because reading params/searchParams already forces them dynamic.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const records = await getRecords();
  return <LandingContent records={records} />;
}
