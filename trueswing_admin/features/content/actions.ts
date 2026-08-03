"use server";

import { revalidatePath } from "next/cache";

import { getSessionToken } from "@/lib/auth/require-session";
import { attachDrill, detachDrill } from "@/lib/content/attach-drill";
import { composeIssue } from "@/lib/content/compose-issue";
import { createDrill } from "@/lib/content/create-drill";
import { deleteDrill } from "@/lib/content/delete-drill";
import { deleteIssue } from "@/lib/content/delete-issue";
import { getDrillsPage } from "@/lib/content/get-drills-page";
import {
  getDrillDeleteImpact,
  getIssueDeleteImpact,
} from "@/lib/content/get-delete-impact";
import { getIssuesPage } from "@/lib/content/get-issues-page";
import { updateDrill } from "@/lib/content/update-drill";
import { updateIssue } from "@/lib/content/update-issue";
import {
  createTaxonomyTerm,
  deleteTaxonomyTerm,
  updateTaxonomyTerm,
} from "@/lib/content/taxonomy-terms";
import { getIssue } from "@/lib/content/get-issue";
import type {
  AdminDrill,
  AdminIssue,
  ComposeIssueBody,
  CreateDrillBody,
  DeleteImpact,
  TaxonomyKind,
  UpdateDrillBody,
  UpdateIssueBody,
} from "@/lib/content/types";

import { contentFailureReason } from "./failure-reason";

const ISSUES_PATH = "/content/issues";
const DRILLS_PATH = "/content/drills";
const COVERAGE_PATH = "/content/coverage";
const TAXONOMY_PATH = "/content/taxonomy";

type ActionResult = { ok: boolean; reason?: string };

/**
 * Every endpoint behind these actions is `require_admin`, so a 403 already means
 * "not an admin" and there is nothing for `withAdmin` to add. This mirrors
 * features/subscriptions/actions.ts rather than the users feature, whose backend
 * routes are only `get_current_user` and therefore need the extra gate.
 */
async function withToken<T>(
  fallback: T,
  fn: (token: string) => Promise<T>,
): Promise<T> {
  const token = await getSessionToken();
  if (!token) return fallback;
  return fn(token);
}

/** Revalidate every content route: a write can move an issue between filtered
 * lists and always changes the coverage grid. */
function revalidateContent() {
  revalidatePath(ISSUES_PATH);
  revalidatePath(DRILLS_PATH);
  revalidatePath(COVERAGE_PATH);
}

/**
 * A vocabulary change reaches further than the taxonomy page.
 *
 * The issue form renders its pickers from the taxonomy, and the coverage grid builds
 * its cells from it — add a chipping miss and a new column should appear there. So a
 * write here revalidates the content pages too, not just its own.
 */
function revalidateTaxonomy() {
  revalidatePath(TAXONOMY_PATH);
  revalidateContent();
}

export async function composeIssueAction(
  body: ComposeIssueBody,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await composeIssue(body, token);
    if (result.status === "ok") {
      revalidateContent();
      return { ok: true };
    }
    return { ok: false, reason: contentFailureReason(result) };
  });
}

/**
 * Edit an issue.
 *
 * Returns the refreshed issue alongside the usual `{ ok, reason }` so the detail
 * view can re-render what was just saved instead of the snapshot the list loaded.
 * The PATCH response already contains it, but `MutationResult` carries no body, so
 * this re-reads rather than widening that type for one caller.
 */
export async function updateIssueAction(
  issueId: string,
  body: UpdateIssueBody,
): Promise<{ ok: boolean; reason?: string; issue?: AdminIssue }> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await updateIssue(issueId, body, token);
    if (result.status !== "ok") {
      return { ok: false, reason: contentFailureReason(result) };
    }
    revalidateContent();
    const refreshed = await getIssue(issueId, token);
    return {
      ok: true,
      issue: refreshed.status === "ok" ? refreshed.data : undefined,
    };
  });
}


export async function deleteIssueAction(
  issueId: string,
  confirmImpact: boolean,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await deleteIssue(issueId, token, { confirmImpact });
    if (result.status === "ok") {
      revalidateContent();
      return { ok: true };
    }
    return { ok: false, reason: contentFailureReason(result) };
  });
}

export async function createDrillAction(body: CreateDrillBody): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await createDrill(body, token);
    if (result.status === "ok") {
      revalidateContent();
      return { ok: true };
    }
    return { ok: false, reason: contentFailureReason(result) };
  });
}

export async function updateDrillAction(
  drillId: string,
  body: UpdateDrillBody,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await updateDrill(drillId, body, token);
    if (result.status === "ok") {
      revalidateContent();
      return { ok: true };
    }
    return { ok: false, reason: contentFailureReason(result) };
  });
}

export async function deleteDrillAction(
  drillId: string,
  confirmImpact: boolean,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await deleteDrill(drillId, token, { confirmImpact });
    if (result.status === "ok") {
      revalidateContent();
      return { ok: true };
    }
    return { ok: false, reason: contentFailureReason(result) };
  });
}

export async function attachDrillAction(
  issueId: string,
  drillId: string,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await attachDrill(issueId, drillId, token);
    if (result.status === "ok") {
      revalidateContent();
      return { ok: true };
    }
    return { ok: false, reason: contentFailureReason(result) };
  });
}

export async function detachDrillAction(
  issueId: string,
  drillId: string,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await detachDrill(issueId, drillId, token);
    if (result.status === "ok") {
      revalidateContent();
      return { ok: true };
    }
    return { ok: false, reason: contentFailureReason(result) };
  });
}

/**
 * Fetch what a delete would destroy, for the confirm dialog.
 *
 * Returns `null` on any failure so the dialog can refuse to offer a delete button
 * it cannot describe — showing "this will remove 0 things" because the impact call
 * failed would be worse than showing nothing.
 */
export async function issueImpactAction(issueId: string): Promise<DeleteImpact | null> {
  return withToken(null, async (token) => {
    const result = await getIssueDeleteImpact(issueId, token);
    return result.status === "ok" ? result.data : null;
  });
}

export async function drillImpactAction(drillId: string): Promise<DeleteImpact | null> {
  return withToken(null, async (token) => {
    const result = await getDrillDeleteImpact(drillId, token);
    return result.status === "ok" ? result.data : null;
  });
}

/** Debounced search from the issues explorer. `ok:false` lets the UI show an error
 * state rather than an empty list, which would read as "no matches". */
export async function searchIssuesAction(
  query: string,
): Promise<{ ok: boolean; matches: AdminIssue[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: true, matches: [] };

  return withToken({ ok: false, matches: [] }, async (token) => {
    const result = await getIssuesPage(token, { limit: 20, offset: 0, q: trimmed });
    if (result.status !== "ok") return { ok: false, matches: [] };
    return { ok: true, matches: result.data.items };
  });
}

export async function searchDrillsAction(
  query: string,
): Promise<{ ok: boolean; matches: AdminDrill[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: true, matches: [] };

  return withToken({ ok: false, matches: [] }, async (token) => {
    const result = await getDrillsPage(token, { limit: 20, offset: 0, q: trimmed });
    if (result.status !== "ok") return { ok: false, matches: [] };
    return { ok: true, matches: result.data.items };
  });
}


// ------------------------------ taxonomy ------------------------------

export async function createTaxonomyTermAction(
  kind: TaxonomyKind,
  body: Record<string, unknown>,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await createTaxonomyTerm(kind, body, token);
    if (result.status !== "ok") {
      return { ok: false, reason: contentFailureReason(result) };
    }
    revalidateTaxonomy();
    return { ok: true };
  });
}

export async function updateTaxonomyTermAction(
  kind: TaxonomyKind,
  key: string,
  body: Record<string, unknown>,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await updateTaxonomyTerm(kind, key, body, token);
    if (result.status !== "ok") {
      return { ok: false, reason: contentFailureReason(result) };
    }
    revalidateTaxonomy();
    return { ok: true };
  });
}

/**
 * Delete a vocabulary value.
 *
 * A 409 here is expected rather than exceptional: the API refuses while issues still
 * carry the term and its `detail` gives the count ("12 issues use this"). contentFailureReason
 * passes that through verbatim, which is the whole point — replacing it with a generic
 * line would throw away the only number the admin needs.
 */
export async function deleteTaxonomyTermAction(
  kind: TaxonomyKind,
  key: string,
): Promise<ActionResult> {
  return withToken({ ok: false, reason: "Your session expired." }, async (token) => {
    const result = await deleteTaxonomyTerm(kind, key, token);
    if (result.status !== "ok") {
      return { ok: false, reason: contentFailureReason(result) };
    }
    revalidateTaxonomy();
    return { ok: true };
  });
}
