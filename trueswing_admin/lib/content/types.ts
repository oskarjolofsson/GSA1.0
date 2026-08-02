/**
 * Content catalog types, derived from the backend's OpenAPI schema
 * (`app/api/v1/schemas/admin_content.py` and `taxonomy.py`). Regenerate with
 * `npm run gen:api-types`; these aliases then track any backend change
 * automatically. See `lib/README.md`.
 */
import type { components } from "@/lib/api/schema";

/** An issue as the catalog editor sees it: ownership, tags, linked drills. */
export type AdminIssue = components["schemas"]["AdminIssueSchema"];

/** One page of issues (`AdminIssuePageResponse`). */
export type AdminIssuePage = components["schemas"]["AdminIssuePageResponse"];

/** A drill with the issues that prescribe it. */
export type AdminDrill = components["schemas"]["AdminDrillSchema"];

/** One page of drills (`AdminDrillPageResponse`). */
export type AdminDrillPage = components["schemas"]["AdminDrillPageResponse"];

/** Body for the composite create: issue + tags + new drills + existing links. */
export type ComposeIssueBody = components["schemas"]["ComposeIssueRequest"];

/** Body for a partial edit. Omit a field to keep it, send "" to clear it. */
export type UpdateIssueBody = components["schemas"]["UpdateAdminIssueRequest"];

/** A drill supplied inline to the composite create. */
export type DraftDrill = components["schemas"]["DraftDrillSchema"];

/** What a delete would remove. `blocking` drives the confirm step. */
export type DeleteImpact = components["schemas"]["DeleteImpactResponse"];

/** Issue counts across the taxonomy, plus catalog health counts. */
export type Coverage = components["schemas"]["CoverageResponse"];

/** One area/miss/goal cell. `issue_count` 0 is a gap. */
export type CoverageCell = components["schemas"]["CoverageCellSchema"];

/** The allowed tag vocabularies, with the words each audience sees. */
export type Taxonomy = components["schemas"]["TaxonomyResponse"];

/**
 * One vocabulary value: `label` for the admin, `golfer_label` + `blurb` for the player.
 *
 * These labels used to live in features/content/constants.ts and, separately, in the expo
 * app — four hand-synced copies of the same list. They come from the API now, which is
 * what let those files go.
 */
export type TaxonomyTerm = components["schemas"]["TaxonomyTermSchema"];

/** A miss, plus the area it belongs to. A putt is not sliced. */
export type TaxonomyMiss = components["schemas"]["TaxonomyMissSchema"];

/**
 * A term as the editor sees it: includes retired values and a usage count.
 *
 * `usage_count > 0` means delete is blocked — issues reference it — and retiring via
 * `active: false` is the way to take it out of circulation instead.
 */
export type AdminTaxonomyTerm = components["schemas"]["AdminTaxonomyTermSchema"];

/** Which vocabulary a taxonomy request targets. Matches the URL segment. */
export type TaxonomyKind = "areas" | "goals" | "misses";
