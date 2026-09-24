// One-off generator: computes the acceptance-check numbers from
// test/fixtures/prototype-records.json and commits them as
// test/fixtures/expected.json (handover §16, "Acceptance checks").
// Run again only if the prototype fixture itself changes.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { filterRecords, getCounts, parseParams, topChips } from "../lib/news";
import { adaptPrototypeRecords, PrototypeRecord } from "../lib/prototype-adapter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const raw = JSON.parse(
  fs.readFileSync(path.join(root, "test/fixtures/prototype-records.json"), "utf8")
) as PrototypeRecord[];

const records = adaptPrototypeRecords(raw);

const approvedCounts = getCounts(records, []);
const allStatuses = ["Approved", "Rejected", "Archived", "Duplicate"];

const indLng = filterRecords(records, parseParams(new URLSearchParams("ind=液化天然氣(LNG)"))).length;
const coEv = filterRecords(
  records,
  parseParams(new URLSearchParams("co=中油|台電&ev=專案得標"))
).length;

const keywordLengNeng = filterRecords(
  records,
  parseParams(new URLSearchParams(`q=冷能&st=${allStatuses.join("|")}`))
)
  .map((r) => r.id)
  .sort();

const statusCountsAllRecords = getCounts(records, allStatuses).statuses;

const dateRange = filterRecords(
  records,
  parseParams(new URLSearchParams("from=2026-09-01&to=2026-09-10"))
).length;

const expected = {
  landingChips: {
    industries: topChips(approvedCounts.industries, 12),
    events: topChips(approvedCounts.events, 14),
    companies: topChips(approvedCounts.companies, 16),
    sites: topChips(approvedCounts.sites, 999),
  },
  indLng,
  coTaipowerCnpcEvAwarded: coEv,
  keywordLengNengAllStatusesIds: keywordLengNeng,
  statusCountsAllRecords,
  dateRangeSep1To10: dateRange,
};

fs.writeFileSync(
  path.join(root, "test/fixtures/expected.json"),
  JSON.stringify(expected, null, 2) + "\n"
);

console.log("wrote test/fixtures/expected.json");
console.log(JSON.stringify(expected, null, 2));
