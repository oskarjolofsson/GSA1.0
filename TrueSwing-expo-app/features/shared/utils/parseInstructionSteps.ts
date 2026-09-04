/**
 * Split a drill's authored text into the steps a golfer reads. Shared by the how-to
 * overlay, the library sheet and the pre-drill brief so all three agree.
 *
 * Splits on periods, so drill text must be authored as sentences (DESIGN.md, "Sequence
 * and instructions"). A segment starting lower-case is rejoined to the one above with its
 * period restored, so "10 ft. from the hole" survives as one step.
 */

/** True when a segment continues the previous sentence rather than starting a new one. */
function isContinuation(segment: string): boolean {
  const first = segment[0];
  if (!first) return false;
  // Explicitly not "is not upper case": a digit or quote mark legitimately opens a new
  // item, so only a lower-case letter counts as continuing.
  return first.toLowerCase() === first && first.toUpperCase() !== first;
}

export function parseInstructionSteps(task: string | null | undefined): string[] {
  if (!task) return [];

  const segments = task
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const items: string[] = [];

  for (const segment of segments) {
    if (items.length > 0 && isContinuation(segment)) {
      items[items.length - 1] = `${items[items.length - 1]}. ${segment}`;
      continue;
    }
    items.push(segment);
  }

  return items;
}
