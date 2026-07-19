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
} as const;
