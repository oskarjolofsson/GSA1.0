import TagChip from "@/features/content/components/tag-chip";
import type { Labels } from "@/features/content/constants";

/**
 * The issue as a golfer sees it in the app's library.
 *
 * `layman_title`/`layman_desc` exist because the coach vocabulary in title and
 * description is unreadable to the target player. When they are blank the app falls
 * back to the technical wording, so this shows that fallback verbatim with a warning
 * rather than quietly substituting nicer copy — the point is to catch jargon before
 * it ships.
 *
 * Layout mirrors TrueSwing-expo-app/features/library/components/IssueCard.tsx.
 */
export default function GolferPreview({
  title,
  description,
  laymanTitle,
  laymanDesc,
  misses,
  goals,
  labels,
}: {
  title: string;
  description: string;
  laymanTitle: string;
  laymanDesc: string;
  misses: string[];
  goals: string[];
  // Label lookups built from the fetched taxonomy. Passed rather than imported so the
  // words come from the database, not a second hardcoded copy.
  labels: Labels;
}) {
  const usingFallback = !laymanTitle.trim() || !laymanDesc.trim();
  const shownTitle = laymanTitle.trim() || title.trim() || "Untitled issue";
  const shownDesc = laymanDesc.trim() || description.trim();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        As a golfer sees it
      </p>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {shownTitle}
        </p>
        {shownDesc ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{shownDesc}</p>
        ) : (
          <p className="mt-1 text-sm italic text-zinc-400">No description yet.</p>
        )}

        {(misses.length > 0 || goals.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {misses.map((m) => (
              <TagChip key={m} tone="miss">
                {labels.golferMissLabel(m)}
              </TagChip>
            ))}
            {goals.map((g) => (
              <TagChip key={g} tone="goal">
                {labels.golferGoalLabel(g)}
              </TagChip>
            ))}
          </div>
        )}
      </div>

      {usingFallback && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          No plain-language copy set, so the golfer reads the coach wording above.
          That is usually too technical.
        </p>
      )}
    </div>
  );
}
