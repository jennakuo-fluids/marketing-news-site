import { describe, expect, it } from "vitest";
import {
  buildSearchText,
  extractWarning,
  normalizeDate,
  pickTitle,
  splitMulti,
  splitSummary,
  validUrl,
} from "@/lib/normalize";

// Stands in for "normalization against a few raw records copied from the
// Step 0 API response" (handover §16) until ragic-schema.md exists — these
// are the primitives lib/ragic.ts's normalizeRecord is built from.

describe("normalizeDate", () => {
  it("accepts YYYY/MM/DD", () => {
    expect(normalizeDate("2026/09/15")).toEqual({ date: "2026/09/15", dateKey: "2026-09-15" });
  });

  it("accepts YYYY-MM-DD", () => {
    expect(normalizeDate("2026-09-15")).toEqual({ date: "2026/09/15", dateKey: "2026-09-15" });
  });

  it("takes only the first 10 characters (drops any time part)", () => {
    expect(normalizeDate("2026-09-15 10:30:00")).toEqual({ date: "2026/09/15", dateKey: "2026-09-15" });
  });

  it("returns empty strings for missing or unparseable input", () => {
    expect(normalizeDate("")).toEqual({ date: "", dateKey: "" });
    expect(normalizeDate(undefined)).toEqual({ date: "", dateKey: "" });
    expect(normalizeDate("not a date")).toEqual({ date: "", dateKey: "" });
  });
});

describe("splitMulti", () => {
  it("splits on 、after normalizing ， and , to it", () => {
    expect(splitMulti("台電、中油")).toEqual(["台電", "中油"]);
    expect(splitMulti("台電，中油")).toEqual(["台電", "中油"]);
    expect(splitMulti("台電,中油")).toEqual(["台電", "中油"]);
  });

  it("trims and drops empties", () => {
    expect(splitMulti("台電、 、中油")).toEqual(["台電", "中油"]);
  });

  it("returns [] for empty input", () => {
    expect(splitMulti("")).toEqual([]);
    expect(splitMulti(undefined)).toEqual([]);
  });

  it("trims and drops empties from array input without re-splitting", () => {
    expect(splitMulti(["  台電 ", "", "中油"])).toEqual(["台電", "中油"]);
  });
});

describe("splitSummary", () => {
  it("splits on newlines and mid-string bullets, stripping bullet/space/tab", () => {
    expect(splitSummary("第一點\n•第二點\n第三點")).toEqual(["第一點", "第二點", "第三點"]);
  });

  it("keeps only the first 6 bullets", () => {
    const eight = Array.from({ length: 8 }, (_, i) => `第${i + 1}點`).join("\n");
    expect(splitSummary(eight)).toHaveLength(6);
  });

  it("drops empties", () => {
    expect(splitSummary("第一點\n\n第二點")).toEqual(["第一點", "第二點"]);
  });
});

describe("extractWarning", () => {
  it("splits the leading ⚠ line into warning, trims the rest into relevancy", () => {
    expect(extractWarning("⚠️ 疑似重複報導\n真正內容")).toEqual({
      warning: "疑似重複報導",
      relevancy: "真正內容",
    });
  });

  it("leaves warning empty when there is no ⚠ line", () => {
    expect(extractWarning("普通內容")).toEqual({ warning: "", relevancy: "普通內容" });
  });
});

describe("pickTitle", () => {
  it("prefers the Chinese title, alt empty when they match", () => {
    expect(pickTitle("同一個標題", "同一個標題")).toEqual({ title: "同一個標題", alt: "" });
  });

  it("uses the English title as alt when both exist and differ", () => {
    expect(pickTitle("中文標題", "English Title")).toEqual({ title: "中文標題", alt: "English Title" });
  });

  it("falls back to the English title when Chinese is missing", () => {
    expect(pickTitle("", "English Title")).toEqual({ title: "English Title", alt: "" });
  });
});

describe("validUrl", () => {
  it("keeps http(s) urls", () => {
    expect(validUrl("https://example.com")).toBe("https://example.com");
    expect(validUrl("http://example.com")).toBe("http://example.com");
  });

  it("drops anything else", () => {
    expect(validUrl("ftp://example.com")).toBe("");
    expect(validUrl("")).toBe("");
    expect(validUrl(undefined)).toBe("");
  });
});

describe("buildSearchText", () => {
  it("lowercases and joins title, alt, and tag fields", () => {
    expect(
      buildSearchText({
        title: "台電新聞",
        alt: "Taipower News",
        companies: ["台電"],
        industries: ["電力"],
        events: ["法規政策"],
      })
    ).toBe("台電新聞 taipower news 台電 電力 法規政策");
  });
});
