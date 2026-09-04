/**
 * Split a drill's authored text into the items a golfer reads, shared by the practice
 * how-to overlay, the library sheet and the pre-drill brief so all three agree.
 *
 * Splits on periods, so drill text must be authored as sentences (a DESIGN.md rule that
 * predates this file). Abbreviations break that -- "10 ft. from the hole" splits in two --
 * so a segment starting with a lower-case letter is treated as a continuation and joined
 * back with its period restored:
 *
 *   "Set up square. Land within 10 ft. from the hole. Reset."
 *     split      -> ["Set up square", "Land within 10 ft", "from the hole", "Reset"]
 *     joined     -> ["Set up square", "Land within 10 ft. from the hole", "Reset"]
 *
 * Capitalisation rather than length, because the stray fragment is sometimes the first
 * piece ("10 ft") and sometimes the last ("out"). The residual risk is an item deliberately
 * authored in lower case folding into the one above it, which is the more legible failure.
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
