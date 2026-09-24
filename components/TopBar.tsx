"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { SearchBox } from "./SearchBox";
import { ThemeToggle } from "./ThemeToggle";

const PLACEHOLDER = "搜尋標題、公司、產業…";

export function TopBar() {
  const pathname = usePathname();
  // The hero search is already visible on the landing page, so the top
  // bar's own search (desktop bar and mobile second row alike) would just
  // be a redundant second search box sitting right above it — hide both
  // there (handover §8, amended after visual review).
  const onLanding = pathname === "/";

  return (
    <header className={`top${!onLanding ? " with-mobile-search" : ""}`}>
      <div className="wrap">
        <div className="topin">
          <Link className="brand" href="/">
            富迪斯 產業新聞庫
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
