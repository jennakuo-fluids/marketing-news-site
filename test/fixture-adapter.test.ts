import { describe, expect, it } from "vitest";
import fixtureRaw from "./fixtures/prototype-records.json";
import { adaptPrototypeRecords, PrototypeRecord } from "./fixture-adapter";

describe("adaptPrototypeRecords", () => {
  const records = adaptPrototypeRecords(fixtureRaw as PrototypeRecord[]);

  it("maps every fixture record", () => {
    expect(records).toHaveLength(fixtureRaw.length);
  });

  it("computes dateKey from the slash-formatted date", () => {
    const first = records.find((r) => r.id === "20260918-31");
    expect(first?.dateKey).toBe("2026-09-15");
  });

  it("never sets alt equal to the title", () => {
    const bad = records.find((r) => r.alt && r.alt === r.title);
    expect(bad).toBeUndefined();
  });

  it("builds searchText that includes tag values, lowercased", () => {
    const withCompany = records.find((r) => r.companies.length > 0);
    expect(withCompany).toBeTruthy();
    expect(withCompany!.searchText).toContain(withCompany!.companies[0].toLowerCase());
  });

  it("keeps warning separate from relevancy when a ⚠ line was present", () => {
    const warned = records.find((r) => r.warning);
    expect(warned).toBeTruthy();
    expect(warned!.relevancy.startsWith("⚠")).toBe(false);
  });
});
