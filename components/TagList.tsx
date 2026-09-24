import Link from "next/link";
import { ParsedParams, toSearchParams } from "@/lib/news";

export type TagField = "co" | "ind" | "ev";
export type Tag = { field: TagField; value: string };

/** Tag pills that link back to /search filtered on that one value. */
export function TagList({ tags, className = "tags" }: { tags: Tag[]; className?: string }) {
  if (tags.length === 0) return null;

  return (
    <div className={className}>
      {tags.map((t, i) => {
        const params = { [t.field]: [t.value] } as Partial<ParsedParams>;
        return (
          <Link key={`${t.field}-${t.value}-${i}`} href={`/search?${toSearchParams(params).toString()}`} className="tag">
            {t.value}
          </Link>
        );
      })}
    </div>
  );
}
