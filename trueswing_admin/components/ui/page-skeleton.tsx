/**
 * Instant loading placeholder for the data-fetching admin pages.
 *
 * Rendered by each route's loading.tsx, so Next paints it the moment you
 * navigate (the topbar + section sidebar stay mounted above the segment) while
 * the server component fetches. A heading bar, a few shimmer rows, and a
 * centered spinner — theme-aware zinc tones matching the real pages.
 */
export default function PageSkeleton() {
  return (
    <div className="flex min-h-[60vh] flex-col" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* Heading placeholder */}
      <div className="h-7 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />

      <div className="relative mt-6 flex-1">
        <ul className="divide-y divide-black/[.06] overflow-hidden rounded-2xl border border-zinc-200 dark:divide-white/[.08] dark:border-zinc-700">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800/60" />
              </div>
            </li>
          ))}
        </ul>

        {/* Centered spinner over the shimmer rows */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
        </div>
      </div>
    </div>
  );
}
