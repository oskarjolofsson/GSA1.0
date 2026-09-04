/**
 * Pure pagination math for the server-paged lists: `?page=N` (1-based, clamped to ≥ 1)
 * in, `limit`/`offset` and the Prev/Next button state out.
 *
 * `pageCount` is at least 1 even when `total` is 0, so an empty list still renders as
 * "page 1 of 1" rather than "1 of 0".
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
