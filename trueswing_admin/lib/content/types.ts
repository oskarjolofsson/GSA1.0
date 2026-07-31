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

/** A drill supplied inline to the composite create. */
export type DraftDrill = components["schemas"]["DraftDrillSchema"];

/** What a delete would remove. `blocking` drives the confirm step. */
export type DeleteImpact = components["schemas"]["DeleteImpactResponse"];

/** Issue counts across the taxonomy, plus catalog health counts. */
export type Coverage = components["schemas"]["CoverageResponse"];

/** One area/miss/goal cell. `issue_count` 0 is a gap. */
export type CoverageCell = components["schemas"]["CoverageCellSchema"];

/** The allowed tag vocabularies. Never hardcode these client-side. */
export type Taxonomy = components["schemas"]["TaxonomyResponse"];
