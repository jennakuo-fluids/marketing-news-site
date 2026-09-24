// Pure functions over NewsRecord[]. No knowledge of Ragic. See handover §10, §16.
import { DEFAULT_STATUSES, NewsRecord, UNCLASSIFIED, statusLabel } from "./types";

export const PAGE_SIZE = 25;

export type FieldCounts = { value: string; count: number }[];

export type Counts = {
  industries: FieldCounts;
  events: FieldCounts;
  companies: FieldCounts;
  sites: FieldCounts;
  statuses: FieldCounts;
};

export type ParsedParams = {
  q: string;
  ind: string[];
  ev: string[];
  co: string[];
  site: string[];
  st: string[];
  from: string;
  to: string;
  page: number;
};

export type RawSearchParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const collator = new Intl.Collator("zh-TW");

function isValidDateKey(s: string): boolean {
  if (!DATE_KEY_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// ---------------------------------------------------------------------------
// URL params
// ---------------------------------------------------------------------------

function getRaw(sp: RawSearchParams, key: string): string {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? "";
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function splitPipe(raw: string): string[] {
  return raw
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseParams(sp: RawSearchParams): ParsedParams {
  const q = getRaw(sp, "q").trim();
  const ind = splitPipe(getRaw(sp, "ind"));
  const ev = splitPipe(getRaw(sp, "ev"));
  const co = splitPipe(getRaw(sp, "co"));
  const site = splitPipe(getRaw(sp, "site"));
  const st = splitPipe(getRaw(sp, "st"));
  const fromRaw = getRaw(sp, "from");
  const toRaw = getRaw(sp, "to");
  const from = isValidDateKey(fromRaw) ? fromRaw : "";
  const to = isValidDateKey(toRaw) ? toRaw : "";
  const pageRaw = parseInt(getRaw(sp, "page"), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  return { q, ind, ev, co, site, st, from, to, page };
}

export function toSearchParams(params: Partial<ParsedParams>): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.ind?.length) sp.set("ind", params.ind.join("|"));
  if (params.ev?.length) sp.set("ev", params.ev.join("|"));
  if (params.co?.length) sp.set("co", params.co.join("|"));
  if (params.site?.length) sp.set("site", params.site.join("|"));
  if (params.st?.length) sp.set("st", params.st.join("|"));
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  return sp;
}

/**
 * Any change to a filter, status, date or keyword drops back to page 1 —
 * only pagination controls should call buildPageUrl. See handover §9.
 */
export function buildFilterUrl(
  current: ParsedParams,
  patch: Partial<Omit<ParsedParams, "page">>
): URLSearchParams {
  return toSearchParams({ ...current, ...patch, page: 1 });
}

export function buildPageUrl(current: ParsedParams, page: number): URLSearchParams {
  return toSearchParams({ ...current, page });
}

/** Whether `/search` with these params should show landing content (no filters at all). */
export function isEmptySearch(params: ParsedParams): boolean {
  return (
    !params.q &&
    params.ind.length === 0 &&
    params.ev.length === 0 &&
    params.co.length === 0 &&
    params.site.length === 0 &&
    params.st.length === 0 &&
    !params.from &&
    !params.to
  );
}

export function activeStatuses(st: string[]): string[] {
  return st.length ? st : [...DEFAULT_STATUSES];
}

/** If a status selection is exactly the implicit default, write nothing to the URL (§10). */
export function normalizeStatusSelection(st: string[]): string[] {
  if (st.length === DEFAULT_STATUSES.length && DEFAULT_STATUSES.every((s) => st.includes(s))) {
    return [];
  }
  return st;
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

function matchesMulti(selected: string[], values: string[]): boolean {
  if (!selected.length) return true;
  return selected.some((v) => (v === UNCLASSIFIED ? values.length === 0 : values.includes(v)));
}

export function filterRecords(records: NewsRecord[], params: ParsedParams): NewsRecord[] {
  const statusSet = new Set(activeStatuses(params.st));
  const words = params.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hasDateBound = Boolean(params.from || params.to);

  return records.filter((r) => {
    if (!statusSet.has(r.status)) return false;
    if (!matchesMulti(params.ind, r.industries)) return false;
    if (!matchesMulti(params.ev, r.events)) return false;
    if (!matchesMulti(params.co, r.companies)) return false;
    if (params.site.length && !params.site.includes(r.site)) return false;
    if (hasDateBound) {
      if (!r.dateKey) return false;
      if (params.from && r.dateKey < params.from) return false;
      if (params.to && r.dateKey > params.to) return false;
    }
    if (words.length && !words.every((w) => r.searchText.includes(w))) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

function countMultiValue(records: NewsRecord[], getValues: (r: NewsRecord) => string[]): FieldCounts {
  const map = new Map<string, number>();
  for (const r of records) {
    const values = getValues(r);
    if (values.length === 0) {
      map.set(UNCLASSIFIED, (map.get(UNCLASSIFIED) ?? 0) + 1);
    } else {
      for (const v of values) {
        map.set(v, (map.get(v) ?? 0) + 1);
      }
    }
  }
  return Array.from(map.entries()).map(([value, count]) => ({ value, count }));
}

function sortCounts(
  entries: FieldCounts,
  opts: { unclassifiedLast?: boolean; label?: (value: string) => string } = {}
): FieldCounts {
  const { unclassifiedLast = false, label = (v: string) => v } = opts;
  return [...entries].sort((a, b) => {
    if (unclassifiedLast) {
      if (a.value === UNCLASSIFIED && b.value !== UNCLASSIFIED) return 1;
      if (b.value === UNCLASSIFIED && a.value !== UNCLASSIFIED) return -1;
    }
    if (b.count !== a.count) return b.count - a.count;
    return collator.compare(label(a.value), label(b.value));
  });
}

export function getCounts(records: NewsRecord[], statuses: string[]): Counts {
  const statusSet = new Set(activeStatuses(statuses));
  const inStatus = records.filter((r) => statusSet.has(r.status));

  return {
    industries: sortCounts(countMultiValue(inStatus, (r) => r.industries), { unclassifiedLast: true }),
    events: sortCounts(countMultiValue(inStatus, (r) => r.events), { unclassifiedLast: true }),
    companies: sortCounts(countMultiValue(inStatus, (r) => r.companies), { unclassifiedLast: true }),
    sites: sortCounts(countMultiValue(inStatus, (r) => (r.site ? [r.site] : [])), {
      unclassifiedLast: true,
    }),
    statuses: sortCounts(
      countMultiValue(records, (r) => (r.status ? [r.status] : [])),
      { label: statusLabel }
    ),
  };
}

/** Drop 未分類 and take the top N — for landing page chips. */
export function topChips(counts: FieldCounts, n: number): FieldCounts {
  return counts.filter((c) => c.value !== UNCLASSIFIED).slice(0, n);
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export type Page<T> = {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
};

export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE): Page<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, totalPages, currentPage };
}

export { statusLabel } from "./types";
