import "server-only";
import fixtureRaw from "@/test/fixtures/prototype-records.json";
import { NewsRecord } from "./types";
import { getAllRecords } from "./ragic";
import { adaptPrototypeRecords, PrototypeRecord } from "./prototype-adapter";
import { sortByDateDesc } from "./ragic";

/**
 * The one function every page calls to get the full record set (handover
 * §3.6). Set USE_FIXTURE_DATA=1 in .env.local to develop and preview the UI
 * against the real 466-record prototype dataset before Ragic Step 0 (§4) is
 * done — never set this in production, and it changes no filtering/sorting
 * logic, only where the records come from.
 */
export async function getRecords(): Promise<NewsRecord[]> {
  if (process.env.USE_FIXTURE_DATA === "1") {
    return sortByDateDesc(adaptPrototypeRecords(fixtureRaw as PrototypeRecord[]));
  }
  return getAllRecords();
}
