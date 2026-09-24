"use client";

import { useMemo, useState } from "react";
import { FieldCounts } from "@/lib/news";

type Props = {
  title: string;
  values: FieldCounts;
  selected: string[];
  onToggle: (value: string) => void;
  labelFor?: (value: string) => string;
};

const FILTER_INPUT_THRESHOLD = 20;

export function FilterGroup({ title, values, selected, onToggle, labelFor }: Props) {
  const [filterText, setFilterText] = useState("");
  const showFilterInput = values.length > FILTER_INPUT_THRESHOLD;
  const label = labelFor ?? ((v: string) => v);

  const visible = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!showFilterInput || !q) return values;
    return values.filter((v) => label(v.value).toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, filterText, showFilterInput]);

  return (
    <div className="fgroup">
      <h3>{title}</h3>
      {showFilterInput && (
        <input
          type="text"
          className="filterinput"
          placeholder="輸入以篩選…"
          aria-label={`篩選${title}`}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      )}
      <div className="opts">
        {visible.map((v) => (
          <label key={v.value} className="opt">
            <input type="checkbox" checked={selected.includes(v.value)} onChange={() => onToggle(v.value)} />
            <span>{label(v.value)}</span>
            <span className="n">{v.count}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
