import type { MutationResult } from "@/lib/api/result";

/**
 * Turn a failed `MutationResult` into copy the admin can act on.
 *
 * Pure so it can be tested without a server: vitest runs in a node environment and
 * only picks up `.test.ts`, so anything worth asserting lives outside the JSX.
 *
 * `invalidInput` and `conflict` pass the backend's `detail` through verbatim rather
 * than substituting a generic line. Those two carry the only information the admin
 * needs: which tag value was rejected, or how many programs a delete would take
 * with it. Replacing them with "something went wrong" throws that away.
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
 * Both drill-delete 409s look alike to the client, but they mean different things:
 * one is "confirm and it will go", the other is "the database will never allow
 * this". Only the second mentions practice runs, so the UI keys off that to avoid
 * offering a confirm button that cannot work.
 */
export function isUndeletableDrill(result: MutationResult): boolean {
  return (
    result.status === "conflict" &&
    (result.detail ?? "").includes("recorded practice runs")
  );
}
