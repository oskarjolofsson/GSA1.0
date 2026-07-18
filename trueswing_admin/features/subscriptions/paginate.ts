/**
 * Pure pagination math for the server-paged subscriber list.
 *
 * The page reads `?page=N` (1-based) from the URL; the API takes `limit`/`offset`.
 * This maps between them and derives the Prev/Next button state, so the view and
 * the tests share one source of truth.
 *
 *   page (1-based, clamped ≥1) ──▶ offset = (page-1)*limit
 *   pageCount = ceil(total/limit)   (at least 1, even when total = 0)
 *   hasPrev = page > 1
 *   hasNext = offset + itemsOnPage < total
 */
export interface PageInfo {
  /** 1-based page actually used after clamping. */
  page: number;
  offset: number;
  limit: number;
  pageCount: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function paginate({
  page,
  total,
  limit,
  itemsOnPage,
}: {
  page: number;
  total: number;
  limit: number;
  /**
   * How many rows the current page actually returned. Defaults to a full page
   * so `hasNext` can be computed before the fetch; pass the real count after.
   */
  itemsOnPage?: number;
}): PageInfo {
  const safeLimit = Math.max(1, Math.floor(limit));
  const safePage = Math.max(1, Math.floor(page) || 1);
  const offset = (safePage - 1) * safeLimit;
  const pageCount = Math.max(1, Math.ceil(Math.max(0, total) / safeLimit));
  const onPage = itemsOnPage ?? safeLimit;

  return {
    page: safePage,
    offset,
    limit: safeLimit,
    pageCount,
    hasPrev: safePage > 1,
    hasNext: offset + onPage < total,
  };
}

/** Parse a `?page=` search param into a clamped 1-based page number. */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
