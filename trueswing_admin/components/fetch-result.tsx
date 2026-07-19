import type { ReactNode } from "react";
import type { FetchResult } from "@/lib/api/result";

/** Small centered message for the non-happy states of a page fetch. */
export function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col">
      <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 px-6 text-center text-sm text-zinc-400 dark:border-zinc-700">
        {body}
      </div>
    </div>
  );
}

type Props<T> = {
  result: FetchResult<T>;
  /** Heading shown on the denied/error notices. */
  title: string;
  /** Body copy when the API says the account isn't an admin (403). */
  deniedBody: string;
  /** Body copy when the API is unreachable (network / 5xx / bad body). */
  errorBody: string;
  /** Rendered only on `ok`, with the fetched data. */
  children: (data: T) => ReactNode;
};

/**
 * Render a three-state `FetchResult` uniformly across admin pages.
 *
 *   ok     ─▶ children(data)
 *   denied ─▶ <Notice> with deniedBody   (account isn't an admin)
 *   error  ─▶ <Notice> with errorBody    (API unreachable — try again)
 *
 * Replaces the denied/error switch every page used to hand-roll. Kept a server
 * component (no "use client") so pages stay server-rendered.
 */
export function FetchResultView<T>({
  result,
  title,
  deniedBody,
  errorBody,
  children,
}: Props<T>) {
  if (result.status === "denied") {
    return <Notice title={title} body={deniedBody} />;
  }
  if (result.status === "error") {
    return <Notice title={title} body={errorBody} />;
  }
  return <>{children(result.data)}</>;
}
