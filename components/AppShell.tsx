"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";

// data-mobile-search lets globals.css bump --header-h to ~112px, but only
// under the 640px breakpoint (see the media query there) — on desktop the
// top bar is always 60px regardless of this flag. The sticky filter bar on
// /search (the only page with one) reads --header-h to offset correctly
// once the second search row appears on mobile (handover §8).
//
// The Suspense boundary here is scoped to ONLY the top bar (whose SearchBox
// uses useSearchParams, which requires one). It deliberately does NOT wrap
// {children}: once a Suspense boundary starts streaming, the HTTP status is
// already committed at 200, so a page further down calling notFound() or
// redirect() could never actually change the response status — it would
// render the right content behind the wrong status code. Keeping {children}
// outside this boundary is what lets /news/[id]'s notFound() return a real
// 404 (handover §11).
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // /signin renders its own standalone page (no signed-in user yet, so no
  // brand/search/sign-out top bar to show).
  if (pathname === "/signin") {
    return <>{children}</>;
  }

  const showMobileSearch = pathname !== "/";

  return (
    <div data-mobile-search={showMobileSearch}>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main id="app">{children}</main>
    </div>
  );
}
