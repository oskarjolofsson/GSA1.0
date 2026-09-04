/**
 * Format an ISO timestamp for display, e.g. "Jul 18, 2026, 08:23".
 *
 * Null, empty and unparseable inputs return "—" rather than "Invalid Date".
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
