"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "./icons";

// Fixes prototype bug #4 (§0.1): use real browser history instead of a hash
// link that always lands on the landing page. document.referrer's origin is
// the best signal available in the browser for "the previous entry is on
// this site" — the History API doesn't expose entry URLs for privacy
// reasons.
export function BackLink() {
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const cameFromThisSite =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer.startsWith(window.location.origin);

    if (cameFromThisSite) {
      router.back();
    } else {
      router.push("/search");
    }
  }

  return (
    <a href="/search" className="back" onClick={handleClick}>
      <ArrowLeftIcon /> 返回搜尋結果
    </a>
  );
}
