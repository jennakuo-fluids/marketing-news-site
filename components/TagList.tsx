import Link from "next/link";
import { buildFilterUrl, ParsedParams, toSearchParams } from "@/lib/news";

export type TagField = "co" | "ind" | "ev";
export type Tag = { field: TagField; value: string };

type Props = {
  tags: Tag[];
  className?: string;
  /** Current filter state, when tags render inside an already-filtered list
   *  (e.g. search results). When given, clicking a tag toggles that value
   *  on/off within the current filters instead of replacing them. */
  current?: ParsedParams;
};

/** Tag pills that link back to /search, toggling that one value on/off within `current`. */
export function TagList({ tags, className = "tags", current }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className={className}>
      {tags.map((t, i) => {
        const isActive = current ? current[t.field].includes(t.value) : false;
        const href = current
          ? buildFilterUrl(current, {
              [t.field]: isActive
                ? current[t.field].filter((v) => v !== t.value)
                : [...current[t.field], t.value],
            } as Partial<ParsedParams>)
          : toSearchParams({ [t.field]: [t.value] } as Partial<ParsedParams>);

        return (
          <Link
            key={`${t.field}-${t.value}-${i}`}
            href={`/search?${href.toString()}`}
            className="tag"
            aria-pressed={current ? isActive : undefined}
          >
            {t.value}
          </Link>
        );
      })}
    </div>
  );
}
