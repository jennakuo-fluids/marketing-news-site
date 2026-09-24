"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { activeStatuses, buildFilterUrl, Counts, normalizeStatusSelection, ParsedParams } from "@/lib/news";
import { statusLabel } from "@/lib/types";
import { CloseIcon } from "./icons";
import { FilterGroup } from "./FilterGroup";

type FieldKey = "ind" | "ev" | "co" | "site";

const FIELD_LABELS: Record<FieldKey, string> = {
  ind: "產業",
  ev: "事件類型",
  co: "公司",
  site: "來源",
};

const FIELD_TITLES: Record<FieldKey, string> = {
  ind: "產業",
  ev: "事件類型",
  co: "公司",
  site: "來源",
};

const PANEL_STORAGE_KEY = "fcg-filter-panel-open";

type Props = {
  current: ParsedParams;
  counts: Counts;
};

// Combines the filter bar (row of field toggles + active-filter pills) and
// the filter panel (checkbox groups) — they share open/scroll state, so
// splitting them would just mean prop-drilling that state back and forth.
// See handover §11.
export function FilterControls({ current, counts }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    try {
      setOpen(sessionStorage.getItem(PANEL_STORAGE_KEY) === "1");
    } catch {
      // sessionStorage unavailable — panel just starts closed.
    }
  }, []);

  function setOpenPersist(next: boolean) {
    setOpen(next);
    try {
      sessionStorage.setItem(PANEL_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function navigate(patch: Partial<ParsedParams>) {
    router.push(`/search?${buildFilterUrl(current, patch).toString()}`);
  }

  function toggleMulti(field: FieldKey, value: string) {
    const list = current[field];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    navigate({ [field]: next } as Partial<ParsedParams>);
  }

  const effectiveSt = activeStatuses(current.st);
  function toggleStatus(value: string) {
    const next = effectiveSt.includes(value)
      ? effectiveSt.filter((v) => v !== value)
      : [...effectiveSt, value];
    navigate({ st: normalizeStatusSelection(next) });
  }

  function openAndScrollTo(key: string) {
    setOpenPersist(true);
    requestAnimationFrame(() => {
      groupRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const fieldButtons: FieldKey[] = ["ind", "ev", "co", "site"];

  const hasActive =
    Boolean(current.q) ||
    current.ind.length > 0 ||
    current.ev.length > 0 ||
    current.co.length > 0 ||
    current.site.length > 0 ||
    current.st.length > 0 ||
    Boolean(current.from) ||
    Boolean(current.to);

  return (
    <div className="bar">
      <div className="wrap barin">
        <div className="barrow">
          <button type="button" className="ghost" aria-pressed={open} onClick={() => setOpenPersist(!open)}>
            篩選條件
          </button>
          {fieldButtons.map((key) => {
            const count = current[key].length;
            return (
              <button
                key={key}
                type="button"
                className="ghost"
                aria-pressed={count > 0}
                onClick={() => openAndScrollTo(key)}
              >
                {FIELD_LABELS[key]}
                {count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
          <button
            type="button"
            className="ghost"
            aria-pressed={current.st.length > 0}
            onClick={() => openAndScrollTo("status")}
          >
            審核狀態
          </button>
        </div>

        {hasActive && (
          <div className="barrow">
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>已套用</span>
            {current.q && (
              <span className="pill">
                「{current.q}」
                <button type="button" aria-label="移除關鍵字" onClick={() => navigate({ q: "" })}>
                  <CloseIcon />
                </button>
              </span>
            )}
            {fieldButtons.flatMap((field) =>
              current[field].map((value) => (
                <span className="pill" key={`${field}-${value}`}>
                  {value}
                  <button type="button" aria-label={`移除 ${value}`} onClick={() => toggleMulti(field, value)}>
                    <CloseIcon />
                  </button>
                </span>
              ))
            )}
            {current.st.map((value) => (
              <span className="pill" key={`st-${value}`}>
                {statusLabel(value)}
                <button
                  type="button"
                  aria-label={`移除 ${statusLabel(value)}`}
                  onClick={() => toggleStatus(value)}
                >
                  <CloseIcon />
                </button>
              </span>
            ))}
            {(current.from || current.to) && (
              <span className="pill">
                {current.from || "…"} ～ {current.to || "…"}
                <button type="button" aria-label="移除日期範圍" onClick={() => navigate({ from: "", to: "" })}>
                  <CloseIcon />
                </button>
              </span>
            )}
            <button type="button" className="linkbtn" onClick={() => router.push("/")}>
              清除全部
            </button>
          </div>
        )}

        <div className={`panel${open ? " open" : ""}`}>
          <div className="panelgrid">
            <div ref={(el) => { groupRefs.current.ind = el; }}>
              <FilterGroup title={FIELD_TITLES.ind} values={counts.industries} selected={current.ind} onToggle={(v) => toggleMulti("ind", v)} />
            </div>
            <div ref={(el) => { groupRefs.current.ev = el; }}>
              <FilterGroup title={FIELD_TITLES.ev} values={counts.events} selected={current.ev} onToggle={(v) => toggleMulti("ev", v)} />
            </div>
            <div ref={(el) => { groupRefs.current.co = el; }}>
              <FilterGroup title={FIELD_TITLES.co} values={counts.companies} selected={current.co} onToggle={(v) => toggleMulti("co", v)} />
            </div>
            <div ref={(el) => { groupRefs.current.site = el; }}>
              <FilterGroup title={FIELD_TITLES.site} values={counts.sites} selected={current.site} onToggle={(v) => toggleMulti("site", v)} />
            </div>
            <div ref={(el) => { groupRefs.current.status = el; }}>
              <FilterGroup
                title="審核狀態"
                values={counts.statuses}
                selected={effectiveSt}
                onToggle={toggleStatus}
                labelFor={statusLabel}
              />
            </div>
            <div ref={(el) => { groupRefs.current.date = el; }} className="fgroup">
              <h3>發布日期</h3>
              <div className="dates">
                <label className="visually-hidden" htmlFor="date-from">起</label>
                <input id="date-from" type="date" value={current.from} onChange={(e) => navigate({ from: e.target.value })} />
                <span>～</span>
                <label className="visually-hidden" htmlFor="date-to">迄</label>
                <input id="date-to" type="date" value={current.to} onChange={(e) => navigate({ to: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
