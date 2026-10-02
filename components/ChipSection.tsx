"use client";

import { useState } from "react";
import Link from "next/link";
import { FieldCounts, ParsedParams, toSearchParams } from "@/lib/news";

type ChipField = "ind" | "ev" | "co" | "site";

type Props = {
  label: string;
  field: ChipField;
  chips: FieldCounts;
  initial?: number;
};

export function ChipSection({ label, field, chips, initial = 6 }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (chips.length === 0) return null;

  return (
    <section className="grp">
      <div className="wrap">
        <h2 className="lbl">{label}</h2>
        <div className="chips">
          {(expanded ? chips : chips.slice(0, initial)).map((c) => {
            const params = { [field]: [c.value] } as Partial<ParsedParams>;
            return (
              <Link key={c.value} href={`/search?${toSearchParams(params).toString()}`} className="chip">
                {c.value} <span className="n">{c.count}</span>
              </Link>
            );
          })}
          {chips.length > initial && (
            <button type="button" className="chipmore" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
              {expanded ? "收合" : `… +${chips.length - initial}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
