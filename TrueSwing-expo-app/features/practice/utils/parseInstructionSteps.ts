export function parseInstructionSteps(task: string | null | undefined): string[] {
  if (!task) return [];

  return task
    .split('.')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}
