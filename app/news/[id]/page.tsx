import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { ExternalLinkIcon, WarningIcon } from "@/components/icons";
import { Tag, TagList } from "@/components/TagList";
import { getRecords } from "@/lib/get-records";
import { statusLabel } from "@/lib/news";

type Props = { params: Promise<{ id: string }> };

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const records = await getRecords();
  const record = records.find((r) => r.id === id);

  if (!record) {
    notFound();
  }

  const tags: Tag[] = [
    ...record.companies.map((value): Tag => ({ field: "co", value })),
    ...record.industries.map((value): Tag => ({ field: "ind", value })),
    ...record.events.map((value): Tag => ({ field: "ev", value })),
  ];

  return (
    <div className="wrap detail">
      <BackLink />

      <TagList tags={tags} />

      <h1>{record.title}</h1>
      {record.alt && <p className="en">{record.alt}</p>}

      <div className="m">
        <span>{record.date}</span>
        <span aria-hidden="true">·</span>
        <span>{record.site}</span>
        <span aria-hidden="true">·</span>
        <span>{record.id}</span>
        {record.status !== "Approved" && <span className="stat">{statusLabel(record.status)}</span>}
      </div>

      {record.warning && (
        <div className="warn" role="alert">
          <WarningIcon />
          <span>{record.warning}</span>
        </div>
      )}

      {record.summary.length > 0 && (
        <div className="box">
          <h2>重點摘要</h2>
          <ul>
            {record.summary.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {record.relevancy && (
        <div className="box tinted">
          <h2>與本公司的關聯</h2>
          <p>{record.relevancy}</p>
        </div>
      )}

      {(record.keywords.length > 0 || record.categories.length > 0) && (
        <div className="kvs">
          {record.keywords.length > 0 && (
            <div className="kv">
              <h2>命中關鍵字</h2>
              <p>{record.keywords.join("、")}</p>
            </div>
          )}
          {record.categories.length > 0 && (
            <div className="kv">
              <h2>命中分類</h2>
              <p>{record.categories.join("、")}</p>
            </div>
          )}
        </div>
      )}

      {record.url && (
        <a className="cta" href={record.url} target="_blank" rel="noopener noreferrer">
          閱讀原文 <ExternalLinkIcon />
        </a>
      )}
    </div>
  );
}
