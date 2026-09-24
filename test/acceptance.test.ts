// Acceptance checks (handover §16) run against the prototype data fixture,
// not live Ragic — its chip counts never reacted to status, so there's
// nothing authoritative to compare against except numbers we compute once
// here and commit (test/fixtures/expected.json, via
// scripts/generate-expected-fixture.ts). Live Ragic only gets a smoke test.
import { describe, expect, it } from "vitest";
import expected from "./fixtures/expected.json";
import fixtureRaw from "./fixtures/prototype-records.json";
import { adaptPrototypeRecords, PrototypeRecord } from "./fixture-adapter";
import { filterRecords, getCounts, parseParams, topChips } from "@/lib/news";

const records = adaptPrototypeRecords(fixtureRaw as PrototypeRecord[]);

describe("acceptance: landing chip counts (Approved only)", () => {
  const counts = getCounts(records, []);

  it("產業 top 12 matches the committed fixture", () => {
    expect(topChips(counts.industries, 12)).toEqual(expected.landingChips.industries);
  });

  it("事件類型 top 14 matches the committed fixture", () => {
    expect(topChips(counts.events, 14)).toEqual(expected.landingChips.events);
  });

  it("公司 top 16 matches the committed fixture", () => {
    expect(topChips(counts.companies, 16)).toEqual(expected.landingChips.companies);
  });

  it("來源 (all) matches the committed fixture", () => {
    expect(topChips(counts.sites, 999)).toEqual(expected.landingChips.sites);
  });
});

describe("acceptance: specific filter combinations", () => {
  it("ind=液化天然氣(LNG) count matches", () => {
    const result = filterRecords(records, parseParams(new URLSearchParams("ind=液化天然氣(LNG)")));
    expect(result.length).toBe(expected.indLng);
  });

  it("co=中油|台電&ev=專案得標 count matches", () => {
    const result = filterRecords(records, parseParams(new URLSearchParams("co=中油|台電&ev=專案得標")));
    expect(result.length).toBe(expected.coTaipowerCnpcEvAwarded);
  });

  it("keyword 冷能 across all statuses returns the expected ID list, including tag-only matches", () => {
    const result = filterRecords(
      records,
      parseParams(new URLSearchParams("q=冷能&st=Approved|Rejected|Archived|Duplicate"))
    );
    expect(result.map((r) => r.id).sort()).toEqual(expected.keywordLengNengAllStatusesIds);
  });

  it("st=Approved|Rejected|Archived|Duplicate gives the unfiltered all-record status counts", () => {
    const counts = getCounts(records, ["Approved", "Rejected", "Archived", "Duplicate"]);
    expect(counts.statuses).toEqual(expected.statusCountsAllRecords);
  });

  it("date range 2026-09-01..2026-09-10 count matches", () => {
    const result = filterRecords(
      records,
      parseParams(new URLSearchParams("from=2026-09-01&to=2026-09-10"))
    );
    expect(result.length).toBe(expected.dateRangeSep1To10);
  });
});
