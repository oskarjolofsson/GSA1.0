/**
 * A user as returned by the TrueSwing API (`GetUser`).
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
