/**
 * Whole days remaining in the free trial, from now until `expiresAt`.
 * Returns 0 once the trial has ended (never negative).
 */
export function daysLeft(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0;

  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return 0;

  const msLeft = end - Date.now();
  if (msLeft <= 0) return 0;

  return Math.ceil(msLeft / (1000 * 60 * 60 * 24));
}
