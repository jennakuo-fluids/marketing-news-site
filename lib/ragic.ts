import "server-only";
import { unstable_cache } from "next/cache";
import { NewsRecord } from "./types";
import {
  buildSearchText,
  extractWarning,
  normalizeDate,
  pickTitle,
  splitMulti,
  splitSummary,
  validUrl,
} from "./normalize";
import { FIELDS, SCHEMA_READY } from "./ragic-fields";

// See handover §3, §4. All Ragic access goes through this module, GET-only,
// to exactly one sheet.

const CHUNK_SIZE = 500;
const CACHE_TAG = "ragic";
const CHUNK_WARN_BYTES = 1.5 * 1024 * 1024;

type RawRagicRecord = Record<string, unknown>;

function ragicConfig() {
  const baseUrl = process.env.RAGIC_BASE_URL;
  const sheetPath = process.env.RAGIC_SHEET_PATH;
  const apiKey = process.env.RAGIC_API_KEY;
  if (!baseUrl || !sheetPath || !apiKey) {
    throw new Error(
      "Missing RAGIC_BASE_URL, RAGIC_SHEET_PATH or RAGIC_API_KEY env var. See .env.local.example."
    );
  }
  return { baseUrl, sheetPath, apiKey };
}

async function fetchPage(offset: number, limit: number): Promise<RawRagicRecord[]> {
  const { baseUrl, sheetPath, apiKey } = ragicConfig();
  const url = `${baseUrl}/${sheetPath}?api&v=3&naming=EId&subtables=0&limit=${limit}&offset=${offset}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Basic ${apiKey}` },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Ragic returned non-JSON response (content-type: "${contentType}"). This usually means the API key is invalid or expired.`
    );
  }
  if (!res.ok) {
    throw new Error(`Ragic request failed: ${res.status} ${res.statusText}`);
  }

  const body = (await res.json()) as Record<string, RawRagicRecord>;
  return Object.values(body);
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function multi(v: unknown): string[] {
  if (Array.isArray(v)) return splitMulti(v.map(String));
  return splitMulti(str(v));
}

export function normalizeRecord(raw: RawRagicRecord): NewsRecord {
  const id = str(raw[FIELDS.newsId]);
  const { date, dateKey } = normalizeDate(str(raw[FIELDS.articleDate]));
  const { title, alt } = pickTitle(str(raw[FIELDS.chineseTitle]), str(raw[FIELDS.articleTitle]));
  const companies = multi(raw[FIELDS.company]);
  const industries = multi(raw[FIELDS.industry]);
  const events = multi(raw[FIELDS.eventType]);
  const categories = multi(raw[FIELDS.matchedCategory]);
  const keywords = multi(raw[FIELDS.matchedKeywords]);
  const summary = splitSummary(str(raw[FIELDS.fullSummary]));
  const { relevancy, warning } = extractWarning(str(raw[FIELDS.relevancy]));
  const status = str(raw[FIELDS.reviewStatus]);
  const url = validUrl(str(raw[FIELDS.articleUrl]));
  const site = str(raw[FIELDS.websiteName]);

  return {
    id,
    title,
    alt,
    date,
    dateKey,
    site,
    url,
    status,
    companies,
    industries,
    events,
    categories,
    keywords,
    summary,
    relevancy,
    warning,
    searchText: buildSearchText({ title, alt, companies, industries, events }),
  };
}

export function sortByDateDesc(records: NewsRecord[]): NewsRecord[] {
  return [...records].sort((a, b) => {
    if (!a.dateKey && !b.dateKey) return 0;
    if (!a.dateKey) return 1;
    if (!b.dateKey) return -1;
    if (a.dateKey === b.dateKey) return 0;
    return a.dateKey < b.dateKey ? 1 : -1;
  });
}

export function dedupeById(records: NewsRecord[]): NewsRecord[] {
  const byId = new Map<string, NewsRecord>();
  for (const r of records) byId.set(r.id, r);
  return Array.from(byId.values());
}

async function fetchChunk(offset: number): Promise<NewsRecord[]> {
  const raw = await fetchPage(offset, CHUNK_SIZE);
  const normalized = raw.map(normalizeRecord);
  const bytes = Buffer.byteLength(JSON.stringify(normalized), "utf8");
  if (bytes > CHUNK_WARN_BYTES) {
    console.warn(
      `[ragic] chunk offset=${offset} is ${(bytes / 1024 / 1024).toFixed(2)}MB, approaching the 2MB cache limit (handover §3)`
    );
  }
  console.log(`[ragic] fetched chunk offset=${offset} records=${normalized.length} bytes=${bytes}`);
  return normalized;
}

const getCachedChunk = unstable_cache(
  (offset: number) => fetchChunk(offset),
  ["ragic-chunk"],
  { tags: [CACHE_TAG] }
);

// Best-effort fallback so a Ragic outage or a failed background revalidation
// doesn't take the site down. unstable_cache's own error behaviour across a
// revalidateTag-triggered regeneration isn't something we can rely on being
// "return the old value on error" (it isn't documented as such), so we keep
// our own last-good snapshot in module memory and fall back to it explicitly.
// This only survives within a warm serverless instance, which is the same
// scope unstable_cache itself is limited to without an external store — good
// enough for v1 (handover §3: "Ragic down or erroring: keep serving the last
// cached chunks if there are one").
let lastGood: NewsRecord[] | null = null;

export async function getAllRecords(): Promise<NewsRecord[]> {
  if (!SCHEMA_READY) {
    throw new Error(
      "lib/ragic-fields.ts still has placeholder field IDs. Run Step 0 (handover §4) first."
    );
  }

  try {
    const chunks: NewsRecord[][] = [];
    let offset = 0;
    for (;;) {
      const chunk = await getCachedChunk(offset);
      chunks.push(chunk);
      if (chunk.length < CHUNK_SIZE) break;
      offset += CHUNK_SIZE;
    }

    const merged = sortByDateDesc(dedupeById(chunks.flat()));
    console.log(`[ragic] total records after merge/dedupe: ${merged.length}`);
    lastGood = merged;
    return merged;
  } catch (err) {
    if (lastGood) {
      console.error(
        `[ragic] refresh failed, serving last known-good snapshot (${lastGood.length} records):`,
        err
      );
      return lastGood;
    }
    console.error("[ragic] refresh failed and no cached snapshot is available:", err);
    throw err;
  }
}
