// Shared normalization primitives used by lib/ragic.ts (raw Ragic -> NewsRecord)
// and by the test fixture adapter (prototype JSON -> NewsRecord). See handover §6.

const DATE_RE = /^(\d{4})[/-](\d{2})[/-](\d{2})$/;

export function normalizeDate(raw: string | undefined | null): {
  date: string;
  dateKey: string;
} {
  const head = (raw ?? "").trim().slice(0, 10);
  const m = head.match(DATE_RE);
  if (!m) return { date: "", dateKey: "" };
  const [, y, mo, d] = m;
  return { date: `${y}/${mo}/${d}`, dateKey: `${y}-${mo}-${d}` };
}

export function splitMulti(raw: string | string[] | undefined | null): string[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => v.trim()).filter(Boolean);
  }
  const s = (raw ?? "").replace(/，/g, "、").replace(/,/g, "、");
  return s
    .split("、")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function splitSummary(raw: string | string[] | undefined | null): string[] {
  if (Array.isArray(raw)) {
    return raw.map((v) => v.trim()).filter(Boolean).slice(0, 6);
  }
  const s = raw ?? "";
  const parts = s.split(/\n\s*|(?<!^)•/).map((v) => v.replace(/^[•\s\t]+|[\s\t]+$/g, "").trim());
  return parts.filter(Boolean).slice(0, 6);
}

export function extractWarning(rawRelevancy: string | undefined | null): {
  relevancy: string;
  warning: string;
} {
  const rel = (rawRelevancy ?? "").trim();
  if (!rel.startsWith("⚠")) return { relevancy: rel, warning: "" };
  const [firstLine, ...rest] = rel.split("\n");
  const warning = firstLine.replace(/^[⚠️\s]+/, "").trim();
  return { relevancy: rest.join("\n").trim(), warning };
}

export function pickTitle(zh: string | undefined | null, en: string | undefined | null): {
  title: string;
  alt: string;
} {
  const z = (zh ?? "").trim();
  const e = (en ?? "").trim();
  const title = z || e;
  const alt = z && e && z !== e ? e : "";
  return { title, alt };
}

export function validUrl(raw: string | undefined | null): string {
  const u = (raw ?? "").trim();
  return /^https?:\/\//.test(u) ? u : "";
}

export function buildSearchText(parts: {
  title: string;
  alt: string;
  companies: string[];
  industries: string[];
  events: string[];
}): string {
  return [parts.title, parts.alt, ...parts.companies, ...parts.industries, ...parts.events]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
