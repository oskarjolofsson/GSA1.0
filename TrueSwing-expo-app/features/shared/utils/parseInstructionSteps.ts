/**
 * Split a drill's `task` into the steps a golfer works through.
 *
 * Shared because two screens render the same instructions now: the practice overlay
 * mid-block, and the library sheet before you commit to a plan. One parse means both
 * always agree about where a step begins.
 *
 * The rule is naive on purpose -- it splits on every period. That works because drill
 * tasks are authored as step lists, and it is why they must keep being authored that
 * way: "roughly 30 to 100 yds. out" becomes two steps, and a task written as one
 * flowing sentence stays one long step.
 */
export function parseInstructionSteps(task: string | null | undefined): string[] {
  if (!task) return [];

  return task
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}
