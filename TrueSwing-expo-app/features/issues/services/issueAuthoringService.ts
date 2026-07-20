import { apiClient } from "lib/apiClient";
import { routes } from "lib/api/routes";
import type { Schemas } from "lib/api/types";

// User-authored issue paths, derived from the backend OpenAPI schema
// (lib/api/schema.d.ts). Regenerate via `npm run gen:api-types`.
export type DraftDrill = Schemas["DraftDrillSchema"];
export type DraftIssue = Schemas["DraftIssueSchema"];
export type CatalogDrill = Schemas["CatalogDrillSchema"];
export type CatalogIssue = Schemas["CatalogIssueSchema"];
export type FeedbackDraft = Schemas["FeedbackDraftResponse"];

/**
 * Coach-feedback path (premium): send the coach's lesson notes (and optionally a
 * base64 photo of them) and get back an editable draft Issue + Drills, plus any
 * lookalike catalog issues. Persists nothing — the user reviews, then confirms
 * with `createCustomIssue`.
 */
export async function structureFeedback(
    text: string,
    image?: { base64: string; mime: string }
): Promise<FeedbackDraft> {
    return apiClient.post<FeedbackDraft>(routes.issues.structureFeedback, {
        text,
        image_base64: image?.base64 ?? null,
        image_mime: image?.mime ?? null,
    });
}

/** Persist a confirmed custom issue + drills. Start it via generateProgramFromIssue. */
export async function createCustomIssue(
    issue: DraftIssue,
    drills: DraftDrill[]
): Promise<CatalogIssue> {
    return apiClient.post<CatalogIssue>(routes.issues.custom, { issue, drills });
}

/** Browseable library: global catalog + the user's own custom issues, with drills. */
export async function getIssueCatalog(): Promise<CatalogIssue[]> {
    const data = await apiClient.get<CatalogIssue[]>(routes.issues.catalog);
    return Array.isArray(data) ? data : [];
}
