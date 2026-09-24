import Link from "next/link";
import { FieldCounts, ParsedParams, toSearchParams } from "@/lib/news";

type ChipField = "ind" | "ev" | "co" | "site";

type Props = {
  label: string;
  field: ChipField;
  chips: FieldCounts;
};

export function ChipSection({ label, field, chips }: Props) {
  if (chips.length === 0) return null;

  return (
    <section className="grp">
      <div className="wrap">
        <h2 className="lbl">{label}</h2>
        <div className="chips">
          {chips.map((c) => {
            const params = { [field]: [c.value] } as Partial<ParsedParams>;
            return (
              <Link key={c.value} href={`/search?${toSearchParams(params).toString()}`} className="chip">
                {c.value} <span className="n">{c.count}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
