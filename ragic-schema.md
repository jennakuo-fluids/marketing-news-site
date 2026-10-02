# Ragic schema — `FCIGroup/dd-probation/2`

Source: `https://ap7.ragic.com/FCIGroup/dd-probation/2?api&v=3&naming=EId&subtables=0`
Mapped 2026-10-02 (handover §4, Step 0). API access is via the **Service Account - AI Robot** key, which needs Viewer rights on this sheet.

All values come back as plain strings. Multi-value fields are one string joined with `、`; there are no JSON arrays.

## Fields the site reads (`lib/ragic-fields.ts`)

| Field ID | Caption | Key in `FIELDS` | Format | Multi? | Example |
|---|---|---|---|---|---|
| 1049902 | News ID | `newsId` | `YYYYMMDD-N` | no | `20261002-18` |
| 1050375 | Article Date | `articleDate` | `YYYY-MM-DD` or `YYYY/MM/DD` (both occur) | no | `2026-10-01` |
| 1049903 | Review Status | `reviewStatus` | `Approved` / `Pending` / `Rejected` / `Archived` | no | `Rejected` |
| 1050374 | Article URL | `articleUrl` | URL | no | `https://www.ctee.com.tw/news/20261001701268-430503` |
| 1050377 | Chinese Title | `chineseTitle` | text, often empty | no | `結盟台塑集團引熱議！中華化親上火線澄清…` |
| 1050376 | Article Title | `articleTitle` | text (original language) | no | `台塑四寶營運展望 南亞樂觀看下半年更上層樓` |
| 1050372 | Website Name | `websiteName` | text | no | `工商時報` |
| 1051172 | Companies | `company` | `、`-joined | yes | `中華化、台塑、台化、台塑化` |
| 1051173 | Industry | `industry` | `、`-joined | yes | `石化／化工、半導體／電子` |
| 1051174 | Event Type | `eventType` | `、`-joined | yes | `合作、擴產` |
| 1050380 | Matched Category | `matchedCategory` | `、`-joined | yes | `業主、產業關鍵字、能源情境` |
| 1050381 | Matched Keywords | `matchedKeywords` | `、`-joined, mixed zh/en | yes | `台塑、Petrochemical plant、Refinery` |
| 1050405 | Full Summary | `fullSummary` | `• `-bulleted lines | no | `• 中華化澄清與台塑企業…` |
| 1050379 | Relevancy | `relevancy` | text; may start with a `⚠` warning line | no | `我司主要代理閥門、儀器儀表與流體控制設備等品牌。…` |

## Other fields on the sheet (not used by the site)

| Field ID | Caption | Example |
|---|---|---|
| 1049904 | Kerwin's Comments | `（同事件群組決定，依 20261001-74）` |
| 1050373 | Website URL | `https://www.ctee.com.tw` |
| 1050407 | Sent Status | `Not Sent` |
| 1050459 | Possible Duplicate | `Not detected` |
| 1050892 | Filter Score | `3` |
| 1051171 | AI Confidence | `40` |
| 1051184 | Full Article Fetched | `Yes` |
| 1051187 | Event Date | `2026/10/01` |
| 1051188 | Event Group | `20261001-74` |
| 1051189 | Auto Rejected | `Yes` |
| 1051190 | Reject Reason | `AI 信心分數 40 低於門檻 50` |
| 1052423 | Jev Topic | `taiwan_owner_project` |
| 1052424 | Jev Confidence | `0.97` |
| 1052425 | Jev Energy Transition | `0.03` |
| 1052426 | Jev Semicon Fab | `0.72` |
| 1052427 | Jev Decision | `review` |

Empty in the sampled records, so their IDs couldn't be matched by value: Description translation, Metadata, Review Time, Group Title, Group Summary, Group Relevancy. These map to some of 1050378, 1050406, 1051182, 1051183, 1051185, 1051186.
