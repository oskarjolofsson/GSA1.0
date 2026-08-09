/**
 * Split a drill's authored text into the items a golfer reads.
 *
 * Shared by three screens now: the practice how-to overlay renders a drill's `task` steps
 * mid-block, the library sheet renders the same ones before the golfer commits, and the
 * pre-drill brief renders a drill's `success_signal`. One parse means all three agree about
 * where an item begins.
 *
 * THE SPLIT IS ON PERIODS, WHICH CONSTRAINS AUTHORING. Drill text must be written as
 * sentences; text written as one flowing clause stays one long item. That rule predates
 * this file and is documented in DESIGN.md.
 *
 * ABBREVIATIONS USED TO BREAK IT. "roughly 30 to 100 yds. out" became two items, and so did
 * "10 ft. from the hole" -- the golfer got half a sentence, then a dangling word. The guard
 * below is NOT a length test: the short fragment is sometimes the first piece ("10 ft") and
 * sometimes the last ("out"), so "merge anything short into its neighbour" merges the wrong
 * way half the time, and it cannot tell "Set up" (a real, short step) from "10 ft" (a
 * fragment).
 *
 * The reliable signal is CAPITALISATION. Authored items are sentences, so a new one starts
 * with a capital; text following an abbreviation's period continues in lower case. So a
 * segment that begins with a lower-case letter is a continuation and is joined back to the
 * item before it, with its period restored.
 *
 *   "Set up square. Land within 10 ft. from the hole. Reset."
 *     split      -> ["Set up square", "Land within 10 ft", "from the hole", "Reset"]
 *     joined     -> ["Set up square", "Land within 10 ft. from the hole", "Reset"]
 *
 * The residual risk is an item deliberately authored in lower case, which would fold into
 * the item above it. That is the better failure: two items becoming one is legible, whereas
 * one item becoming two half-sentences is not.
 */

/** True when a segment continues the previous sentence rather than starting a new one. */
function isContinuation(segment: string): boolean {
  const first = segment[0];
  if (!first) return false;
  // Explicitly not "is not upper case": a digit or a quote mark legitimately opens a new
  // item ("10 balls to each target"), so only a lower-case letter counts as continuing.
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
