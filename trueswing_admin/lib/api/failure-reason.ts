import type { MutationResult } from "@/lib/api/result";

/**
 * Copy that only the calling feature can word: what the admin was denied, and what
 * to say when the failure carries no usable detail.
 */
export type FailureCopy = {
  denied: string;
  fallback: string;
};

/**
 * Turn a failed `MutationResult` into copy the admin can act on.
 *
 * The branches that pass `detail` through verbatim are the ones where the backend
 * names something the admin has to know — which value was rejected, how many programs
 * a delete would take with it, or that an account was left intact. The auth branches
 * never pass it through: a permissions message is about the caller, not the resource.
 */
export function failureReason(
  result: MutationResult,
  copy: FailureCopy,
): string | undefined {
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
      return copy.denied;
    case "unauthorized":
      return "Your session expired. Sign in again.";
    case "invalidState":
      return result.detail ?? "That isn't valid right now.";
    case "serviceUnavailable":
      return "The service is temporarily unavailable. Try again shortly.";
    default:
      return copy.fallback;
  }
}
