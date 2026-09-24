import { FilterControls } from "@/components/FilterControls";
import { LandingContent } from "@/components/LandingContent";
import { Pagination } from "@/components/Pagination";
import { ResultCard } from "@/components/ResultCard";
import { getRecords } from "@/lib/get-records";
import { filterRecords, getCounts, isEmptySearch, paginate, parseParams } from "@/lib/news";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const params = parseParams(sp);
  const records = await getRecords();

  if (isEmptySearch(params)) {
    return <LandingContent records={records} />;
  }

  const filtered = filterRecords(records, params);
  const counts = getCounts(records, params.st);
  const { items, currentPage, totalPages, total } = paginate(filtered, params.page);

  return (
    <>
      <FilterControls current={params} counts={counts} />
      <div className="wrap">
        <div className="count">
          <p>
            共 <strong>{total}</strong> 筆
          </p>
          <span className="sort">依發布日期排序（新到舊）</span>
        </div>

        {items.length === 0 ? (
          <p className="empty">找不到符合條件的新聞，試著放寬篩選或換個關鍵字。</p>
        ) : (
          <div className="list">
            {items.map((r) => (
              <ResultCard key={r.id} record={r} current={params} />
            ))}
          </div>
        )}

        <Pagination current={params} currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
