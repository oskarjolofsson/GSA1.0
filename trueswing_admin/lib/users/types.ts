/**
 * A user as returned by the TrueSwing API (`GET /api/v1/users/all/`).
 *
 * Hand-written on purpose: that endpoint has no `response_model` on the backend,
 * so its shape is absent from `/openapi.json` and can't be derived by
 * `gen:api-types` (unlike the subscription types). To make this generatable,
 * give the backend endpoint a `response_model`, then alias from
 * `components["schemas"][...]` like `lib/subscriptions/types.ts` does.
 *
 * The optional fields are `X | null` on the backend and simply absent/null for
 * older rows, so keep them nullable here rather than assuming they're present.
 */
export interface User {
  id: string;
  email: string;
  name: string;

  role: string | null;
  authProvider: string | null;
  active: boolean | null;
  analysesCount: number | null;
  drillsCompleted: number | null;

  created_at: string;
  updated_at: string | null;
}
