import { describe, expect, it } from "vitest";
import {
  buildFilterUrl,
  buildPageUrl,
  filterRecords,
  getCounts,
  normalizeStatusSelection,
  paginate,
  parseParams,
  toSearchParams,
  topChips,
} from "@/lib/news";
import { NewsRecord, UNCLASSIFIED, statusLabel } from "@/lib/types";

function rec(overrides: Partial<NewsRecord>): NewsRecord {
  return {
    id: "id",
    title: "title",
    alt: "",
    date: "2026/09/15",
    dateKey: "2026-09-15",
    site: "經濟日報",
    url: "",
    status: "Approved",
    companies: [],
    industries: [],
    events: [],
    categories: [],
    keywords: [],
    summary: [],
    relevancy: "",
    warning: "",
    searchText: "title",
    ...overrides,
  };
}

describe("filterRecords", () => {
  it("defaults to Approved-only when st is absent", () => {
    const records = [
      rec({ id: "1", status: "Approved" }),
      rec({ id: "2", status: "Pending" }),
      rec({ id: "3", status: "Rejected" }),
    ];
    const result = filterRecords(records, parseParams(new URLSearchParams()));
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("st=Rejected shows only Rejected", () => {
    const records = [rec({ id: "1", status: "Approved" }), rec({ id: "2", status: "Rejected" })];
    const result = filterRecords(records, parseParams(new URLSearchParams("st=Rejected")));
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("st=Pending shows only Pending", () => {
    const records = [rec({ id: "1", status: "Approved" }), rec({ id: "2", status: "Pending" })];
    const result = filterRecords(records, parseParams(new URLSearchParams("st=Pending")));
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("is OR within one field, AND across fields", () => {
    const records = [
      rec({ id: "1", companies: ["台電"], industries: ["電力"] }),
      rec({ id: "2", companies: ["中油"], industries: ["電力"] }),
      rec({ id: "3", companies: ["台電"], industries: ["石化"] }),
      rec({ id: "4", companies: ["中油"], industries: ["石化"] }),
    ];
    const result = filterRecords(
      records,
      parseParams(new URLSearchParams("co=台電,中油&ind=電力"))
    );
    // co is OR'd (either matches all 4), AND'd with ind=電力 -> only 1 and 2
    expect(result.map((r) => r.id).sort()).toEqual(["1", "2"]);
  });

  it("treats empty 產業/事件類型/公司 as 未分類 and it is filterable", () => {
    const records = [rec({ id: "1", industries: [] }), rec({ id: "2", industries: ["電力"] })];
    const result = filterRecords(records, parseParams(new URLSearchParams(`ind=${UNCLASSIFIED}`)));
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("date range: from only", () => {
    const records = [rec({ id: "1", dateKey: "2026-09-10" }), rec({ id: "2", dateKey: "2026-09-20" })];
    const result = filterRecords(records, parseParams(new URLSearchParams("from=2026-09-15")));
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("date range: to only", () => {
    const records = [rec({ id: "1", dateKey: "2026-09-10" }), rec({ id: "2", dateKey: "2026-09-20" })];
    const result = filterRecords(records, parseParams(new URLSearchParams("to=2026-09-15")));
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("date range: both, inclusive", () => {
    const records = [
      rec({ id: "1", dateKey: "2026-09-10" }),
      rec({ id: "2", dateKey: "2026-09-15" }),
      rec({ id: "3", dateKey: "2026-09-20" }),
    ];
    const result = filterRecords(
      records,
      parseParams(new URLSearchParams("from=2026-09-15&to=2026-09-15"))
    );
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("excludes undated records once any date bound is set", () => {
    const records = [rec({ id: "1", date: "", dateKey: "" }), rec({ id: "2", dateKey: "2026-09-20" })];
    const result = filterRecords(records, parseParams(new URLSearchParams("from=2026-09-01")));
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("multi-word keyword requires every word to match", () => {
    const records = [
      rec({ id: "1", searchText: "台電 冷能 專案" }),
      rec({ id: "2", searchText: "台電 專案" }),
    ];
    const result = filterRecords(records, parseParams(new URLSearchParams("q=台電 冷能")));
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("keyword can match through a tag only, not just the title", () => {
    const records = [
      rec({ id: "1", title: "Taipower plans new grid", searchText: "taipower plans new grid 台電" }),
    ];
    const result = filterRecords(records, parseParams(new URLSearchParams("q=台電")));
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });
});

describe("getCounts", () => {
  const records = [
    rec({ id: "1", status: "Approved", companies: ["台電"] }),
    rec({ id: "2", status: "Approved", companies: ["台電"] }),
    rec({ id: "3", status: "Approved", companies: ["中油"] }),
    rec({ id: "4", status: "Rejected", companies: ["中鋼"] }),
    rec({ id: "5", status: "Pending", companies: [] }),
  ];

  it("counts follow the selected statuses: default is Approved only", () => {
    const counts = getCounts(records, []);
    expect(counts.companies).toEqual([
      { value: "台電", count: 2 },
      { value: "中油", count: 1 },
    ]);
  });

  it("st=Rejected counts only Rejected records", () => {
    const counts = getCounts(records, ["Rejected"]);
    expect(counts.companies).toEqual([{ value: "中鋼", count: 1 }]);
  });

  it("審核狀態 is counted over all records regardless of selected statuses", () => {
    const counts = getCounts(records, ["Rejected"]);
    expect(counts.statuses.reduce((sum, c) => sum + c.count, 0)).toBe(records.length);
  });

  it("sorts by count desc, then zh-TW collation, 未分類 last", () => {
    const tieRecords = [
      rec({ id: "1", companies: ["輝達"] }),
      rec({ id: "2", companies: ["中鋼"] }),
      rec({ id: "3", companies: [] }),
      rec({ id: "4", companies: ["台電"] }),
      rec({ id: "5", companies: ["台電"] }),
    ];
    const counts = getCounts(tieRecords, []);
    expect(counts.companies.map((c) => c.value)).toEqual(["台電", "中鋼", "輝達", UNCLASSIFIED]);
  });

  it("includes the Pending status label", () => {
    expect(statusLabel("Pending")).toBe("待審核");
  });
});

describe("topChips", () => {
  it("excludes 未分類 and caps at n", () => {
    const counts = [
      { value: "台電", count: 5 },
      { value: UNCLASSIFIED, count: 4 },
      { value: "中油", count: 3 },
      { value: "中鋼", count: 2 },
    ];
    expect(topChips(counts, 2)).toEqual([
      { value: "台電", count: 5 },
      { value: "中油", count: 3 },
    ]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 30 }, (_, i) => i);

  it("clamps page below 1 to 1", () => {
    expect(paginate(items, 0).currentPage).toBe(1);
    expect(paginate(items, -5).currentPage).toBe(1);
  });

  it("clamps page beyond the last page to the last page", () => {
    const result = paginate(items, 999, 25);
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(2);
  });
});

describe("parseParams <-> toSearchParams round trip", () => {
  it("round-trips values containing 、／()  and spaces", () => {
    const params = {
      q: "台電 冷能",
      ind: ["液化天然氣(LNG)", "電力／公用事業"],
      ev: ["專案得標"],
      co: ["中油", "台電"],
      site: ["經濟日報"],
      st: ["Approved", "Rejected"],
      from: "2026-09-01",
      to: "2026-09-10",
      page: 3,
    };
    const roundTripped = parseParams(toSearchParams(params));
    expect(roundTripped).toEqual(params);
  });

  it("omits page when it is 1", () => {
    const sp = toSearchParams({ q: "x", page: 1 });
    expect(sp.has("page")).toBe(false);
  });

  it("tolerates invalid input instead of erroring", () => {
    const sp = new URLSearchParams("page=abc&from=not-a-date&to=2026-13-99");
    const parsed = parseParams(sp);
    expect(parsed.page).toBe(1);
    expect(parsed.from).toBe("");
    expect(parsed.to).toBe(""); // 2026-13-99 matches the shape but is left to filtering to ignore
  });
});

describe("multi-select filters are comma-separated in the URL", () => {
  it("parses a comma-separated field into multiple values", () => {
    const params = parseParams(new URLSearchParams("ind=電力,石化,LNG"));
    expect(params.ind).toEqual(["電力", "石化", "LNG"]);
  });

  it("serializes multiple values joined by commas, not pipes", () => {
    const sp = toSearchParams({ co: ["台電", "中油"] });
    expect(sp.get("co")).toBe("台電,中油");
  });

  it("toggling a value on then off returns to the original selection (URL round trip)", () => {
    const empty = parseParams(new URLSearchParams());
    const withValue = parseParams(buildFilterUrl(empty, { ind: [...empty.ind, "電力"] }));
    expect(withValue.ind).toEqual(["電力"]);

    const toggledOff = parseParams(
      buildFilterUrl(withValue, { ind: withValue.ind.filter((v) => v !== "電力") })
    );
    expect(toggledOff.ind).toEqual([]);
  });
});

describe("normalizeStatusSelection", () => {
  it("clears the selection back to implicit default when it equals [Approved]", () => {
    expect(normalizeStatusSelection(["Approved"])).toEqual([]);
  });

  it("keeps any other selection explicit", () => {
    expect(normalizeStatusSelection(["Approved", "Rejected"])).toEqual(["Approved", "Rejected"]);
    expect(normalizeStatusSelection(["Rejected"])).toEqual(["Rejected"]);
    expect(normalizeStatusSelection([])).toEqual([]);
  });
});

describe("buildFilterUrl / buildPageUrl", () => {
  it("any filter change drops back to page 1", () => {
    const current = parseParams(new URLSearchParams("ind=電力&page=4"));
    const next = parseParams(buildFilterUrl(current, { co: ["台電"] }));
    expect(next.page).toBe(1);
    expect(next.co).toEqual(["台電"]);
    expect(next.ind).toEqual(["電力"]);
  });

  it("only buildPageUrl sets page", () => {
    const current = parseParams(new URLSearchParams("ind=電力"));
    const next = parseParams(buildPageUrl(current, 3));
    expect(next.page).toBe(3);
    expect(next.ind).toEqual(["電力"]);
  });
});
