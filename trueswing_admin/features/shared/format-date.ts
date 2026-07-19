/**
 * Format an ISO timestamp for display, e.g. "Jul 18, 2026, 08:23".
 *
 * The API sends full-precision UTC ISO strings like
 * `2026-07-18T08:23:23.636190Z`, which are unreadable raw. This renders a
 * short local date + time. Null, empty, and unparseable inputs return "—"
 * rather than "Invalid Date" so a missing timestamp reads cleanly.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
