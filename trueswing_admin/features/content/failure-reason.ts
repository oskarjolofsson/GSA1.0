import { failureReason } from "@/lib/api/failure-reason";
import type { MutationResult } from "@/lib/api/result";

/**
 * Why a content mutation failed, in words the admin can act on.
 *
 * `invalidInput` and `conflict` pass the backend's `detail` through verbatim: those two
 * carry the only actionable part — which tag value was rejected, or how many programs a
 * delete would take with it.
 */
export function contentFailureReason(result: MutationResult): string | undefined {
  return failureReason(result, {
    denied: "You aren't authorized to change content.",
    fallback: "Couldn't save. The API may be unreachable — try again.",
  });
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
