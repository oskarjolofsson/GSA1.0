import { authedFetch } from "@/lib/api/authed-fetch";
import { routes } from "@/lib/api/routes";
import {
  toMutationResult,
  toResult,
  type FetchResult,
  type MutationResult,
} from "@/lib/api/result";
import type { AdminTaxonomyTerm, TaxonomyKind } from "./types";

/**
 * List every term of one kind, including retired ones.
 *
 * Inactive rows are included on purpose: this is the editor, and a retired value you
 * cannot see is one you cannot bring back. Each row carries `usage_count`, so the UI
 * can disable delete without a request per row.
 */
export async function listTaxonomyTerms(
  kind: TaxonomyKind,
  token: string,
): Promise<FetchResult<AdminTaxonomyTerm[]>> {
  const res = await authedFetch(routes.contentTaxonomyList(kind), token);
  return toResult(res, async (r) => {
    const data = (await r.json()) as AdminTaxonomyTerm[];
    return Array.isArray(data) ? data : null;
  });
}

/**
 * Add a vocabulary value.
 *
 * Keys are normalised server-side (upper-cased, spaces and hyphens to underscores), so
 * `slice` and `SLICE` collide with a 409 rather than becoming two rows.
 */
export async function createTaxonomyTerm(
  kind: TaxonomyKind,
  body: Record<string, unknown>,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentTaxonomyCreate(kind), token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toMutationResult(res);
}

/**
 * Edit labels, ordering or active state. Partial: omitted fields are left alone.
 *
 * `key` is not editable — issues, issue_goals and issue_misses all reference it, so a
 * rename would orphan every tag. `active: false` is how a term in use is retired.
 */
export async function updateTaxonomyTerm(
  kind: TaxonomyKind,
  key: string,
  body: Record<string, unknown>,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentTaxonomyUpdate(kind, key), token, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toMutationResult(res);
}

/**
 * Remove a vocabulary value.
 *
 * A 409 is the normal case, not an error path: the API refuses while issues still carry
 * the term and its `detail` gives the count. `active: false` is the alternative.
 */
export async function deleteTaxonomyTerm(
  kind: TaxonomyKind,
  key: string,
  token: string,
): Promise<MutationResult> {
  const res = await authedFetch(routes.contentTaxonomyDelete(kind, key), token, {
    method: "DELETE",
  });
  return toMutationResult(res);
}
