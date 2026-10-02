import { gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { receipts } from "@/db/schema";

export const LOW_CONFIDENCE = 0.6;
export const MAX_PAGE_SIZE = 100;

// Same list columns and conventions as GET /api/receipts - heavy fields
// (imageUrl, receiptText) deliberately excluded from the list payload.
export const listColumns = {
  id: receipts.id,
  vendorName: receipts.vendorName,
  date: receipts.date,
  totalAmount: receipts.totalAmount,
  vatAmount: receipts.vatAmount,
  vatRate: receipts.vatRate,
  basCode: receipts.basCode,
  category: receipts.category,
  status: receipts.status,
  createdAt: receipts.createdAt,
  hasImage: sql<boolean>`${receipts.imageUrl} is not null`,
} as const;

export const SORT_COLUMNS = {
  date: receipts.date,
  vendor: receipts.vendorName,
  bas: receipts.basCode,
  vat: receipts.vatAmount,
  amount: receipts.totalAmount,
  status: receipts.status,
} as const;

/** q / from / to / sort / page params shared by both accountant receipt lists. */
export function parseListParams(sp: URLSearchParams) {
  const conditions: SQL[] = [];
  const q = sp.get("q")?.trim() ?? "";
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(receipts.vendorName, like),
        ilike(receipts.basCode, like),
        ilike(sql`${receipts.totalAmount}::text`, like),
      )!,
    );
  }
  const from = sp.get("from");
  const to = sp.get("to");
  if (from) conditions.push(gte(receipts.date, new Date(from)));
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(receipts.date, end));
  }
  const sortKey = (sp.get("sort") ?? "date") as keyof typeof SORT_COLUMNS;
  return {
    conditions,
    page: Math.max(1, Number(sp.get("page")) || 1),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, Number(sp.get("pageSize")) || 25)),
    sortCol: SORT_COLUMNS[sortKey] ?? receipts.date,
    dir: sp.get("dir") === "asc" ? sql`asc` : sql`desc`,
  };
}
