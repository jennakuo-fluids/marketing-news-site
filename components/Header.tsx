"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";

const PLACEHOLDER = "搜尋標題、公司、產業…";

// Single shared header, rendered once by AppShell on every page except
// /signin — no page owns its own header markup. Logo swap is pure CSS
// (both images render, .logo-light/.logo-dark visibility follows the same
// data-theme attribute the color tokens use), so it never flashes the
// wrong logo before hydration.
export function Header() {
  const pathname = usePathname();
  // The hero search is already visible on the landing page, so the header's
  // own search (desktop bar and mobile second row alike) would just be a
  // redundant second search box sitting right above it — hide both there
  // (handover §8, amended after visual review).
  const onLanding = pathname === "/";

  return (
    <header className={`top${!onLanding ? " with-mobile-search" : ""}`}>
      <div className="wrap">
        <div className="topin">
          <Link className="brandmark" href="/">
            <img src="/logo-fluids.png" alt="富迪斯" className="logo logo-light" />
            <img src="/logo-fluids-dark.png" alt="富迪斯" className="logo logo-dark" />
            <span className="headerdivider" aria-hidden="true" />
            <span className="brandtitle">產業新聞庫</span>
          </Link>
          {!onLanding && (
            <SearchBox id="topbar-search" className="topsearch" placeholder={PLACEHOLDER} showButton={false} />
          )}
          <div className="topactions">
            <ThemeToggle />
            <form action={signOutAction}>
              <button type="submit" className="signout">
                登出
              </button>
            </form>
          </div>
        </div>
        {!onLanding && (
          <SearchBox
            id="topbar-search-mobile"
            className="topsearch2"
            placeholder={PLACEHOLDER}
            showButton={false}
          />
        )}
      </div>
    </header>
  );
}
