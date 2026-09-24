// TODO(Step 0, handover §4): every value below is a placeholder. Before
// writing or running any feature code, call the Ragic API once with the real
// key and sheet path:
//
//   curl -H "Authorization: Basic $RAGIC_API_KEY" \
//     "$RAGIC_BASE_URL/$RAGIC_SHEET_PATH?api&v=3&naming=EId&subtables=0&limit=3"
//
// `naming=EId` returns each field keyed by its Ragic "English ID", which is
// NOT the caption and NOT the numeric field ID. Read the raw JSON response,
// match each key to the caption you recognize (using the field list in
// handover §5), and paste the real EId strings in below. Then write
// `ragic-schema.md` in the repo root (field ID | caption | type | multi-value?
// | raw example) per §4, and delete this comment block.
//
// Until this is done, lib/ragic.ts will normalize every record to empty
// fields (see normalizeRecord's use of these keys) — that's intentional, so
// a stale schema fails loudly instead of silently.
export const FIELDS = {
  newsId: "TODO_NewsID",
  articleDate: "TODO_ArticleDate",
  reviewStatus: "TODO_ReviewStatus",
  articleUrl: "TODO_ArticleURL",
  chineseTitle: "TODO_ChineseTitle",
  articleTitle: "TODO_ArticleTitle",
  websiteName: "TODO_WebsiteName",
  company: "TODO_Company",
  industry: "TODO_Industry",
  eventType: "TODO_EventType",
  matchedCategory: "TODO_MatchedCategory",
  matchedKeywords: "TODO_MatchedKeywords",
  fullSummary: "TODO_FullSummary",
  relevancy: "TODO_Relevancy",
} as const;

export const SCHEMA_READY = !Object.values(FIELDS).some((v) => v.startsWith("TODO_"));
