/**
 * The admin-facing TrueSwing API surface, in one place.
 *
 * Every path the `lib/` data layer hits lives here instead of as a string
 * literal scattered across request functions. Paths are relative (leading slash,
 * no host) — `authedFetch`/`verifyAdmin` prepend `NEXT_PUBLIC_API_URL`. Builders
 * that take query params own their own encoding so callers can't forget it.
 */
export const routes = {
  /** GET → { is_admin: boolean }. Admin gate at sign-in. */
  adminVerify: () => "/api/v1/admin/verify/",

  /** GET → UserPage. Paged list of users (require_admin). */
  usersPage: ({ limit, offset }: { limit: number; offset: number }) =>
    `/api/v1/users/?limit=${limit}&offset=${offset}`,

  /** GET → User[]. Search users by name/email (require_admin). */
  usersSearch: ({ q, limit }: { q: string; limit: number }) =>
    `/api/v1/users/search/?q=${encodeURIComponent(q)}&limit=${limit}`,

  /** DELETE → 204. Single user by id. */
  user: (userId: string) => `/api/v1/users/${userId}/`,

  /** PATCH → GetUser. Change a user's role (require_admin). */
  userRole: (userId: string) => `/api/v1/users/${userId}/role/`,

  /** POST (grant) → 201. Manual comp subscription collection. */
  adminSubscriptions: () => "/api/v1/admin/subscriptions/",

  /** DELETE (revoke) → 204. Single manual subscription by id. */
  adminSubscription: (subscriptionId: string) =>
    `/api/v1/admin/subscriptions/${subscriptionId}/`,

  /** GET → SubscriberPage. Paged list of currently-valid subscribers. */
  adminSubscriptionsPage: ({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }) => `/api/v1/admin/subscriptions/?limit=${limit}&offset=${offset}`,

  /** GET → ProfileMatch[]. Search customers to grant to. */
  adminSubscriptionsSearch: ({ q, limit }: { q: string; limit: number }) =>
    `/api/v1/admin/subscriptions/search/?q=${encodeURIComponent(q)}&limit=${limit}`,

  // ---------- content catalog (all require_admin) ----------

  /** GET → Taxonomy. The allowed area/miss/goal/kind values. Authenticated, not
   * admin-only: tag pickers render from this so they can never offer a value the
   * strict validators on the write paths would reject. */
  taxonomy: () => "/api/v1/taxonomy/",

  /** GET → AdminTaxonomyTerm[]. Every term of one kind, including retired ones, each
   * with a usage count. Admin-only, unlike the read above: this is the editor. */
  contentTaxonomyList: (kind: string) => `/api/v1/admin/content/taxonomy/${kind}/`,

  /** POST → AdminTaxonomyTerm. Add a vocabulary value. 409 if the key is taken. */
  contentTaxonomyCreate: (kind: string) => `/api/v1/admin/content/taxonomy/${kind}/`,

  /** PATCH → AdminTaxonomyTerm. Edit labels, ordering or active state. `key` is
   * immutable — content references it, so a rename would orphan every tag. */
  contentTaxonomyUpdate: (kind: string, key: string) =>
    `/api/v1/admin/content/taxonomy/${kind}/${encodeURIComponent(key)}/`,

  /** DELETE → 204, or 409 with a count when issues still use the term. */
  contentTaxonomyDelete: (kind: string, key: string) =>
    `/api/v1/admin/content/taxonomy/${kind}/${encodeURIComponent(key)}/`,

  /** GET → AdminIssuePage. Paged catalog issues with tags and drills. */
  contentIssuesPage: ({
    limit,
    offset,
    q,
    area,
    kind,
    source,
  }: {
    limit: number;
    offset: number;
    q?: string;
    area?: string;
    kind?: string;
    source?: string;
  }) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (q) params.set("q", q);
    if (area) params.set("area", area);
    if (kind) params.set("kind", kind);
    if (source) params.set("source", source);
    return `/api/v1/admin/content/issues/?${params}`;
  },

  /** GET → AdminIssue. POST (compose) → AdminIssue. */
  contentIssues: () => "/api/v1/admin/content/issues/",

  /** GET → AdminIssue. DELETE → 204, or 409 without confirmImpact when referenced. */
  contentIssue: (issueId: string, { confirmImpact }: { confirmImpact?: boolean } = {}) =>
    `/api/v1/admin/content/issues/${issueId}/${
      confirmImpact ? "?confirm_impact=true" : ""
    }`,

  /** GET → DeleteImpact. What a delete of this issue would destroy. */
  contentIssueImpact: (issueId: string) =>
    `/api/v1/admin/content/issues/${issueId}/impact/`,

  /** GET → AdminDrillPage. Paged drills with the issues that prescribe them. */
  contentDrillsPage: ({
    limit,
    offset,
    q,
  }: {
    limit: number;
    offset: number;
    q?: string;
  }) => {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (q) params.set("q", q);
    return `/api/v1/admin/content/drills/?${params}`;
  },

  /** POST → AdminDrill. Create a global catalog drill. */
  contentDrills: () => "/api/v1/admin/content/drills/",

  /** GET → AdminDrill. PATCH → AdminDrill. DELETE → 204 / 409. */
  contentDrill: (drillId: string, { confirmImpact }: { confirmImpact?: boolean } = {}) =>
    `/api/v1/admin/content/drills/${drillId}/${
      confirmImpact ? "?confirm_impact=true" : ""
    }`,

  /** GET → DeleteImpact. drill_runs > 0 means the delete is impossible, not just
   * destructive — practice_drill_runs is ON DELETE NO ACTION. */
  contentDrillImpact: (drillId: string) =>
    `/api/v1/admin/content/drills/${drillId}/impact/`,

  /** POST (attach) / DELETE (detach) → AdminIssue. */
  contentIssueDrill: (issueId: string, drillId: string) =>
    `/api/v1/admin/content/issues/${issueId}/drills/${drillId}/`,

  /** GET → Coverage. Issue counts per area/miss/goal, plus catalog health counts. */
  contentCoverage: () => "/api/v1/admin/content/coverage/",
} as const;
