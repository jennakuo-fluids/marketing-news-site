import Link from "next/link";
import { buildPageUrl, ParsedParams } from "@/lib/news";

type Props = {
  current: ParsedParams;
  currentPage: number;
  totalPages: number;
};

export function Pagination({ current, currentPage, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  function href(page: number) {
    return `/search?${buildPageUrl(current, page).toString()}`;
  }

  return (
    <nav className="pager" aria-label="分頁">
      {currentPage <= 1 ? (
        <span className="disabled">上一頁</span>
      ) : (
        <Link href={href(currentPage - 1)}>上一頁</Link>
      )}
      {pages.map((p) =>
        p === currentPage ? (
          <Link key={p} href={href(p)} aria-current="page">
            {p}
          </Link>
        ) : (
          <Link key={p} href={href(p)}>
            {p}
          </Link>
        )
      )}
      {currentPage >= totalPages ? (
        <span className="disabled">下一頁</span>
      ) : (
        <Link href={href(currentPage + 1)}>下一頁</Link>
      )}
    </nav>
  );
}
