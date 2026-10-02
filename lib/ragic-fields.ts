// Ragic field IDs for FCIGroup/dd-probation/2 (handover §4, Step 0).
// `naming=EId` keys each record by these numeric field IDs. Mapped
// 2026-10-02 by matching `naming=EId` against caption-keyed responses — see
// ragic-schema.md for captions, formats and examples. If a field is renamed
// in Ragic its ID stays the same; if it's deleted and recreated, re-run Step 0.
export const FIELDS = {
  newsId: "1049902",
  articleDate: "1050375",
  reviewStatus: "1049903",
  articleUrl: "1050374",
  chineseTitle: "1050377",
  articleTitle: "1050376",
  websiteName: "1050372",
  company: "1051172",
  industry: "1051173",
  eventType: "1051174",
  matchedCategory: "1050380",
  matchedKeywords: "1050381",
  fullSummary: "1050405",
  relevancy: "1050379",
} as const;

export const SCHEMA_READY = !Object.values(FIELDS).some((v) => v.startsWith("TODO_"));
