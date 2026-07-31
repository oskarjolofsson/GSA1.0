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
import type { AdminDrill, AdminIssue, ComposeIssueBody, DeleteImpact } from "@/lib/content/types";

import { contentFailureReason } from "./failure-reason";

const ISSUES_PATH = "/content/issues";
const DRILLS_PATH = "/content/drills";
const COVERAGE_PATH = "/content/coverage";

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

export async function createDrillAction(body: {
  title: string;
  task: string;
  success_signal: string;
  fault_indicator: string;
}): Promise<ActionResult> {
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
  body: {
    title?: string;
    task?: string;
    success_signal?: string;
    fault_indicator?: string;
  },
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
