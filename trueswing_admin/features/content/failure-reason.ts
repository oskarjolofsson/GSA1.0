import type { MutationResult } from "@/lib/api/result";

/**
 * Turn a failed `MutationResult` into copy the admin can act on.
 *
 * `invalidInput` and `conflict` pass the backend's `detail` through verbatim: those two
 * carry the only actionable part — which tag value was rejected, or how many programs a
 * delete would take with it.
 */
export function contentFailureReason(result: MutationResult): string | undefined {
  switch (result.status) {
    case "ok":
      return undefined;
    case "invalidInput":
      return result.detail ?? "Some of those values aren't allowed.";
    case "conflict":
      return result.detail ?? "That conflicts with something that already exists.";
    case "notFound":
      return result.detail ?? "That no longer exists — it may have been deleted.";
    case "denied":
      return "You aren't authorized to change content.";
    case "unauthorized":
      return "Your session expired. Sign in again.";
    case "invalidState":
      return result.detail ?? "That isn't valid right now.";
    case "serviceUnavailable":
      return "The service is temporarily unavailable. Try again shortly.";
    default:
      return "Couldn't save. The API may be unreachable — try again.";
  }
}

/**
 * True when a drill delete was refused because of recorded practice history.
 *
 * The two drill-delete 409s are otherwise identical — one clears with confirmation, the
 * other never will — so this string match is what stops the UI offering a confirm button
 * that cannot work.
 */
export function isUndeletableDrill(result: MutationResult): boolean {
  return (
    result.status === "conflict" &&
    (result.detail ?? "").includes("recorded practice runs")
  );
}
