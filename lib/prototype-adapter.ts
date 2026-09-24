// Adapts the prototype's embedded records (field names zh, en, st, co, ind,
// ev, cat, kw, sum, rel, warn — see handover Appendix A) into NewsRecord, so
// acceptance checks (§16) can run against real data without hitting Ragic.
import { NewsRecord } from "@/lib/types";
import { buildSearchText, normalizeDate, pickTitle, validUrl } from "@/lib/normalize";

export type PrototypeRecord = {
  id: string;
  zh: string;
  en: string;
  date: string;
  site: string;
  url: string;
  st: string;
  co: string[];
  ind: string[];
  ev: string[];
  cat: string[];
  kw: string[];
  sum: string[];
  rel: string;
  warn: string;
};

function cleanList(values: string[]): string[] {
  return values.map((v) => v.trim()).filter(Boolean);
}

export function adaptPrototypeRecord(p: PrototypeRecord): NewsRecord {
  const { date, dateKey } = normalizeDate(p.date);
  const { title, alt } = pickTitle(p.zh, p.en);
  const companies = cleanList(p.co);
  const industries = cleanList(p.ind);
  const events = cleanList(p.ev);

  return {
    id: p.id,
    title,
    alt,
    date,
    dateKey,
    site: (p.site ?? "").trim(),
    url: validUrl(p.url),
    status: (p.st ?? "").trim(),
    companies,
    industries,
    events,
    categories: cleanList(p.cat),
    keywords: cleanList(p.kw),
    summary: cleanList(p.sum).slice(0, 6),
    relevancy: (p.rel ?? "").trim(),
    warning: (p.warn ?? "").trim(),
    searchText: buildSearchText({ title, alt, companies, industries, events }),
  };
}

export function adaptPrototypeRecords(records: PrototypeRecord[]): NewsRecord[] {
  return records.map(adaptPrototypeRecord);
}
