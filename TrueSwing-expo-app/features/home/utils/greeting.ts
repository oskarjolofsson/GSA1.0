/**
 * The line under "Hello, {name}".
 *
 * Pure on purpose: the caller passes the day key, so the phrase is stable across renders and
 * the function stays testable.
 *
 * Voice, from DESIGN.md: direct, practical, honest. No exclamation marks, no congratulation
 * for showing up.
 */

export type GreetingState = 'none' | 'one' | 'many';

const SUBTITLES: Record<GreetingState, readonly string[]> = {
  none: [
    'Nothing on the go — pick something to work on',
    'Your plan is empty. Fancy starting something?',
    'No focus yet. The library is a good place to start.',
  ],
  one: [
    'One thing on the go this week',
    'Working your {area} — keep at it',
    '{area} is your focus right now',
  ],
  many: [
    '{n} areas on the go this week',
    "You're juggling {n} focuses",
    '{n} areas in play — pick one to get into',
  ],
};

/** Which bucket a golfer is in, from the number of areas they have work in. */
export function greetingStateFor(areaCount: number): GreetingState {
  if (areaCount <= 0) return 'none';
  if (areaCount === 1) return 'one';
  return 'many';
}

/**
 * Stable small hash of the day key. Not cryptographic — it only has to spread
 * consecutive dates across the phrase list so the line changes day to day
 * rather than cycling in a way that reads as mechanical.
 */
function hashDay(dayKey: string): number {
  let h = 0;
  for (let i = 0; i < dayKey.length; i++) {
    h = (h * 31 + dayKey.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** "2026-08-05" for a given date. The caller owns the clock. */
export function dayKeyFor(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface Greeting {
  title: string;
  subtitle: string;
}

/**
 * @param state      which bucket the golfer is in
 * @param dayKey     "YYYY-MM-DD"; the same key always yields the same phrase
 * @param name       may be null/blank — a signed-in golfer can have no name set
 * @param areaLabel  golfer-facing area name, only used by the "one" phrases
 * @param areaCount  only used by the "many" phrases
 */
export function pickGreeting(
  state: GreetingState,
  dayKey: string,
  name?: string | null,
  areaLabel?: string | null,
  areaCount?: number
): Greeting {
  const trimmed = (name ?? '').trim();
  // Never render "Hello, null". A golfer with no name gets a greeting that
  // does not have a hole in it.
  const title = trimmed ? `Hello, ${trimmed}` : 'Hello';

  const options = SUBTITLES[state];
  const template = options[hashDay(dayKey) % options.length];

  const subtitle = template
    .replace('{area}', (areaLabel ?? '').trim() || 'your focus')
    .replace('{n}', String(areaCount ?? 0));

  return { title, subtitle };
}
