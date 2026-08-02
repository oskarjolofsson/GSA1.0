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
 * Contract: GET /api/v1/admin/content/taxonomy/{kind}/
 *   → 200 AdminTaxonomyTermSchema[]
 *     403 not admin
 *
 * Inactive rows are included on purpose: this is the editor, and a retired value you
 * cannot see is a value you cannot bring back. Each row carries `usage_count`, so the UI
 * can disable delete on a term issues still reference without a request per row.
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
 * Contract: POST /api/v1/admin/content/taxonomy/{kind}/
 *   body CreateTaxonomyTermRequest
 *   → 201 AdminTaxonomyTermSchema
 *     403 not admin
 *     409 the key is taken
 *     422 a miss naming an area that does not exist
 *
 * Keys are normalised server-side (upper-cased, spaces and hyphens to underscores), so
 * `slice` and `SLICE` collide rather than becoming two rows.
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
 * Contract: PATCH /api/v1/admin/content/taxonomy/{kind}/{key}/
 *   → 200 AdminTaxonomyTermSchema
 *     404 unknown key
 *
 * `key` is not editable. Issues, issue_goals and issue_misses all reference it, so a
 * rename would orphan every tag. Setting `active: false` is how a term in use is taken
 * out of circulation.
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
 * Contract: DELETE /api/v1/admin/content/taxonomy/{kind}/{key}/
 *   → 204
 *     409 issues still use it, with `detail` giving the count
 *     404 unknown key
 *
 * The 409 is the normal case rather than an error path: deleting would mean retagging
 * every issue that carries the term, so the API refuses and names `active: false` as the
 * alternative.
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
