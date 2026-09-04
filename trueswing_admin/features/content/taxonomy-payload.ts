/**
 * Pure helpers for the taxonomy editor. Validation returns a reason string or undefined,
 * so the disabled save button can explain itself.
 */

import type { AdminTaxonomyTerm, TaxonomyKind } from "@/lib/content/types";

export type TermDraft = {
  key: string;
  label: string;
  golferLabel: string;
  blurb: string;
  sort: string;
  /** Only meaningful for misses. Ignored for areas and goals. */
  area: string;
};

export const emptyTermDraft = (area = ""): TermDraft => ({
  key: "",
  label: "",
  golferLabel: "",
  blurb: "",
  sort: "0",
  area,
});

export function draftFromTerm(term: AdminTaxonomyTerm): TermDraft {
  return {
    key: term.key,
    label: term.label,
    golferLabel: term.golfer_label,
    blurb: term.blurb ?? "",
    sort: String(term.sort ?? 0),
    area: term.area ?? "",
  };
}

/**
 * Mirror of the server's key normalisation, so the admin sees what will actually be
 * stored before committing to it. The backend's version is authoritative. See ADR-0009.
 */
export const normalizeKey = (raw: string) =>
  raw.trim().toUpperCase().replace(/[\s-]+/g, "_");

/** Why the save button is disabled, or undefined when it should be enabled. */
export function validateTermDraft(
  draft: TermDraft,
  kind: TaxonomyKind,
): string | undefined {
  if (!normalizeKey(draft.key)) return "A term needs a key.";
  if (!draft.label.trim()) return "A term needs a label for the admin view.";
  if (!draft.golferLabel.trim()) return "A term needs the wording a golfer reads.";
  if (kind === "misses" && !draft.area.trim()) {
    return "A miss has to belong to an area — a putt is not sliced.";
  }
  if (draft.sort.trim() && Number.isNaN(Number(draft.sort))) {
    return "Sort has to be a number.";
  }
  return undefined;
}

/** Non-blocking nudges. A term saves fine without these. */
export function termWarning(draft: TermDraft, kind: TaxonomyKind): string | undefined {
  if (kind === "misses" && !draft.blurb.trim()) {
    return "No subtitle. Short-game terms need one most — every golfer knows what a slice is, almost none could name a chunk.";
  }
  return undefined;
}

export function toCreateBody(draft: TermDraft, kind: TaxonomyKind) {
  const body: Record<string, unknown> = {
    key: normalizeKey(draft.key),
    label: draft.label.trim(),
    golfer_label: draft.golferLabel.trim(),
    blurb: draft.blurb.trim() || null,
    sort: Number(draft.sort || 0),
  };
  if (kind === "misses") body.area = draft.area.trim();
  return body;
}

/**
 * `key` is deliberately absent: issues reference it, so the API refuses to change it.
 * Reword a term through its labels; replace it by adding the new one and retiring the old.
 */
export function toUpdateBody(draft: TermDraft, kind: TaxonomyKind) {
  const body: Record<string, unknown> = {
    label: draft.label.trim(),
    golfer_label: draft.golferLabel.trim(),
    blurb: draft.blurb.trim() || null,
    sort: Number(draft.sort || 0),
  };
  if (kind === "misses") body.area = draft.area.trim();
  return body;
}
