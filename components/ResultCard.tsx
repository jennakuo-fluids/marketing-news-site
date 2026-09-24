import Link from "next/link";
import { Tag, TagList } from "@/components/TagList";
import { NewsRecord } from "@/lib/types";
import { statusLabel } from "@/lib/news";

export function ResultCard({ record }: { record: NewsRecord }) {
  const tags: Tag[] = [
    ...record.companies.slice(0, 2).map((value): Tag => ({ field: "co", value })),
    ...record.industries.slice(0, 2).map((value): Tag => ({ field: "ind", value })),
    ...record.events.slice(0, 2).map((value): Tag => ({ field: "ev", value })),
  ];
  const snippet = record.summary.join("　");

  return (
    <article className="card">
      <Link href={`/news/${record.id}`} className="t">
        {record.title}
      </Link>
      {record.alt && <p className="en">{record.alt}</p>}
      <div className="m">
        <span>{record.date}</span>
        <span aria-hidden="true">·</span>
        <span>{record.site}</span>
        {record.status !== "Approved" && <span className="stat">{statusLabel(record.status)}</span>}
      </div>
      <TagList tags={tags} />
      {snippet && <p className="snip">{snippet}</p>}
    </article>
  );
}
