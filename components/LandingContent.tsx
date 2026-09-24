import { ChipSection } from "@/components/ChipSection";
import { SearchBox } from "@/components/SearchBox";
import { NewsRecord } from "@/lib/types";
import { filterRecords, getCounts, parseParams, topChips } from "@/lib/news";

// Shared by / and /search with no filter params (handover §9: "/search with
// no filter params shows the landing content").
export function LandingContent({ records }: { records: NewsRecord[] }) {
  const approved = filterRecords(records, parseParams(new URLSearchParams()));
  const counts = getCounts(records, []);

  const total = approved.length;
  const latest = approved.find((r) => r.date)?.date ?? "";
  const siteCount = counts.sites.length;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>產業新聞搜尋</h1>
          <p className="meta">
            收錄 <strong>{total}</strong> 筆新聞 · 最新新聞 <strong>{latest}</strong> ·{" "}
            <strong>{siteCount}</strong> 個來源
          </p>
          <SearchBox id="hero-search" className="bigsearch" placeholder="搜尋標題、公司、產業…" />
          <p className="hint">同時搜尋標題與標籤 · 或直接點下方標籤開始</p>
        </div>
      </section>

      <ChipSection label="依產業" field="ind" chips={topChips(counts.industries, 12)} />
      <ChipSection label="依事件類型" field="ev" chips={topChips(counts.events, 14)} />
      <ChipSection label="依公司" field="co" chips={topChips(counts.companies, 16)} />
      <ChipSection label="依來源" field="site" chips={topChips(counts.sites, 999)} />
    </>
  );
}
