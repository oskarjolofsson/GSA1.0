import { apiClient } from "lib/apiClient";

// Mirrors backend app/api/v1/schemas/issue.py (user-authored issue paths).

export interface DraftDrill {
    title: string;
    task: string;
    success_signal: string;
    fault_indicator: string;
    // Fields the AI inferred rather than took from the coach — surface for review.
    ai_filled: string[];
}

export interface DraftIssue {
    title: string;
    description: string;
    area?: string;
    kind?: "fault" | "skill";
    miss?: string | null;
    goals?: string[];
    layman_title?: string | null;
    layman_desc?: string | null;
}

export interface CatalogDrill {
    id: string;
    title: string;
    task: string;
    success_signal: string;
    fault_indicator: string;
}

export interface CatalogIssue {
    id: string;
    title: string;
    description: string | null;
    area: string;
    kind: "fault" | "skill";
    source: "catalog" | "custom";
    // Plain-language browse layer (what a 12-handicap reads).
    layman_title: string | null;
    layman_desc: string | null;
    // Navigation tags: goal (WHY) and miss (WHAT the golfer sees).
    goals: string[];
    misses: string[];
    drills: CatalogDrill[];
}

export interface FeedbackDraft {
    issue: DraftIssue;
    drills: DraftDrill[];
    // Existing catalog issues that look like this feedback (offer reuse).
    similar_issues: CatalogIssue[];
}

const BASE = "/api/v1/issues";

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
    return apiClient.post<FeedbackDraft>(`${BASE}/structure-feedback/`, {
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
    return apiClient.post<CatalogIssue>(`${BASE}/custom/`, { issue, drills });
}

/** Browseable library: global catalog + the user's own custom issues, with drills. */
export async function getIssueCatalog(): Promise<CatalogIssue[]> {
    const data = await apiClient.get<CatalogIssue[]>(`${BASE}/catalog/`);
    return Array.isArray(data) ? data : [];
}
