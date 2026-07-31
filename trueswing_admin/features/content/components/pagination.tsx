import Link from "next/link";
import type { PageInfo } from "@/features/shared/paginate";

const linkBase =
  "rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors dark:border-zinc-700";
const enabled =
  "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800";
const disabled = "pointer-events-none opacity-40 text-zinc-400";

/** Prev/Next as links so each page is a fresh server fetch, matching the users and
 * subscriptions screens. `basePath` keeps the query on the right route. */
export default function Pagination({
  pageInfo,
  basePath,
}: {
  pageInfo: PageInfo;
  basePath: string;
}) {
  const { page, pageCount, hasPrev, hasNext } = pageInfo;

  return (
    <div className="mt-4 flex items-center justify-between">
      <Link
        href={`${basePath}?page=${page - 1}`}
        className={`${linkBase} ${hasPrev ? enabled : disabled}`}
        aria-disabled={!hasPrev}
      >
        Previous
      </Link>
      <span className="text-sm text-zinc-400">
        Page {page} of {pageCount}
      </span>
      <Link
        href={`${basePath}?page=${page + 1}`}
        className={`${linkBase} ${hasNext ? enabled : disabled}`}
        aria-disabled={!hasNext}
      >
        Next
      </Link>
    </div>
  );
}
