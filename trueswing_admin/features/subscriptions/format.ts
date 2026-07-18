/**
 * Display helpers for subscription rows.
 */

/**
 * Render a subscription's period end. Manual comp grants have no expiry
 * (`current_period_end = null`) — show that plainly rather than an "Invalid
 * Date". An unparseable string also falls back to the no-expiry label.
 */
export function formatPeriodEnd(iso: string | null): string {
  if (!iso) return "No expiry";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "No expiry";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
