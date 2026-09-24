export type NewsRecord = {
  id: string;
  title: string;
  alt: string;
  date: string; // "YYYY/MM/DD" or ""
  dateKey: string; // "YYYY-MM-DD" or ""
  site: string;
  url: string;
  status: string; // raw Ragic value: Approved, Rejected, Archived, Duplicate, Pending, ...
  companies: string[];
  industries: string[];
  events: string[];
  categories: string[];
  keywords: string[];
  summary: string[];
  relevancy: string;
  warning: string;
  searchText: string;
};

export type FilterField = "ind" | "ev" | "co" | "site";

export const UNCLASSIFIED = "未分類" as const;

export const STATUS_LABELS: Record<string, string> = {
  Approved: "已核准",
  Rejected: "已退回",
  Archived: "已封存",
  Duplicate: "重複",
  Pending: "待審核",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export const DEFAULT_STATUSES = ["Approved"] as const;
