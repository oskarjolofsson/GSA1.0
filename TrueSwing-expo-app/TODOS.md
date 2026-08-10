# TODOS

## Practice Library (features/library)

- **AI-matching in the library.** Add a "Describe what's going wrong" box atop
  `LibraryScreen` that calls the existing `structureFeedback()`
  (`features/issues/services/issueAuthoringService.ts`) and scrolls to / highlights the
  returned `similar_issues` in the list. Reuses the coach-feedback AI path — no new
  backend. Revisit once plain search proves insufficient or the catalog grows past
  ~30 issues.
  - Deferred during the CEO review of the library reformat (2026-07-10) to avoid
    overlap with the coach-feedback flow until search is shown to be the bottleneck.

- **Author the goal-first content.** The library now navigates GOAL -> MISS -> focus in
  plain language. This only works if the ~15 catalog issues are tagged: set
  `layman_title`, `layman_desc`, `goals[]` (STRAIGHTER/DISTANCE/CONTACT/BIG_MISS/
  SHORT_GAME/PUTTING) and `misses[]` (SLICE/HOOK/PULL/PUSH/TOP/THIN/FAT/LOW_WEAK) per
  issue. Goals with no tagged issues render "Coming soon". Add a couple of `kind='skill'`
  focuses (e.g. a clubhead-speed protocol under DISTANCE) so the non-fault path is real.

- **Seed the other areas of the game.** `area` is now the course-location set
  (`FULL_SWING`, `CHIPPING`, `PUTTING`, `BUNKER`, `PITCHING`); only full-swing content
  exists. Author chipping/putting/bunker/pitching issues and tag them to goals/misses.

- **Skill-focus program semantics.** A `kind='skill'` focus has no fault to retest;
  confirm `program_service` runs it as a fixed-length protocol before wiring the first one.

## Practice (features/practice)

- **Error reporting service (P2).** The app has no crash/error reporting — every
  failure ends at `console.error`, which nobody reads in production. The CEO review of
  the practice execution UX (2026-08-08) found four error paths in that feature alone,
  three of them silent: a failed `completeStep` congratulated the golfer while their
  plan never advanced, and a failed `endDrill`/`endSession`/`startDrill` trapped them on
  a permanent spinner. That branch makes those visible to the *golfer*; they stay
  invisible to us. Add Sentry (or equivalent) with the Expo integration so a broken plan
  advance surfaces without someone emailing in. Needs a native rebuild.
  - Effort: M (human) -> S (CC). Depends on nothing.

- **Device-level E2E framework (P3).** No E2E framework exists anywhere in the app —
  testing is `jest-expo` + RNTL only. The eng review of the practice execution UX
  (2026-08-08) found a bug that lives *between* components: `useScreenSequence` holds
  `currentIndex` in local state, so swapping the session prop would have left the golfer
  staring at the complete screen after tapping Continue. Every unit test would have
  passed. That specific case is now covered by a `homeFlow` integration test with mocked
  services (the chosen approach), but the general class of between-components bug is not.
  Evaluate Maestro (YAML flows against a simulator) or Detox.
  - Revisit when a second between-components bug reaches a user, or before any release
    process that needs a smoke suite.
  - Cons: spends an innovation token; CI simulator management and flake handling become
    ours. Effort: L (human) -> M (CC).

- **Orphan practice sessions (P3).** A golfer who backgrounds the app or navigates away
  mid-session leaves a practice session open server-side. `homeFlow.tsx:47-59` resets
  `selectedSession` on refocus, so the app forgets the session; the server does not.
  First thing to check is whether an open session skews the contribution graph or the
  program schedule — that determines whether the fix is a client-side end-on-blur, a
  server-side sweep, or nothing at all.
  - Effort: S (human) -> S (CC), after an investigation of unknown size.
  - Surfaced by the CEO review of practice execution UX (2026-08-08).

## Home screen (features/home)

- **"Played a round" has no entry point (P2).** The home-screen simplification
  (2026-08-09) removed `LogRoundRow` because it was the loudest thing on a screen where
  the golfer could not find the Start button — it held two of the screen's three gold
  appearances. The capability itself still works: a round is a `practice_sessions` row
  with `session_type='play'`, the backend records it, and the contribution graph renders
  it as its own unattributed segment. Nothing can create one now.
  - Decide: is logging a round worth an entry point at all? If yes, the natural home is
    inside the practice flow's completion screen or the focus drawer, NOT competing with
    Start practice on home.
  - Surfaced by the design review of the home simplification (2026-08-09), which noted
    the row was removed as clutter but is actually a working feature, not an unbuilt one.
  - Effort: S (human) -> S (CC). Depends on the home simplification landing.

- **`DayDetailModal` has no entry point (P3).** The month grid went read-only in the same
  change: at 14 columns a square is ~18px against a 44px touch floor, with 2px gaps, so
  hitSlop would overlap into wrong-day taps. Tapping a day used to open that day's
  sessions and analyses (`HomeScreen.tsx` `onDayPress` -> `DayDetailModal`).
  - Options considered: move day detail behind the "Streak" section header as a full
    scrollable list (rejected as scope for now), or delete it.
  - "Your swings" (`ArchiveEntry`) still covers looking back at analyses, so the gap is
    per-day session detail specifically.
  - Effort: S (human) -> S (CC) to delete; M -> S to rehome as a list.

## Billing (features/billing)

- **Strip the TEMP diagnostics from `BillingContext` (P2).** Two `console.log` calls
  marked "TEMP DIAGNOSTIC — remove once confirmed" are still in the shipping path.
  `BillingContext.tsx:60` logs the entire `BillingStatus` object (`JSON.stringify(next)`)
  on every refresh, including on every app foreground past the 45s staleness window.
  `BillingContext.tsx:103` logs `new Error().stack` on every `openPaywall` call, so a
  stack trace is captured on a routine user-facing action. Neither was removed once the
  cross-platform subscription and paywall behaviour they were added to confirm had been
  confirmed.
  - Deliberately kept out of the paywall redesign branch (eng review, 2026-08-10) to
    keep that diff to one concern. Nothing blocks doing it standalone.
  - Effort: XS (human) -> XS (CC). Depends on nothing.

- **`refreshUntilPremium` fetches twice per attempt (P2).** `BillingContext.tsx:88-100`
  runs up to 8 attempts and issues **two** `getBillingStatus()` calls in each one, so a
  successful purchase can cost 16 backend round-trips over ~8 seconds. Reading the loop:
  `:89 await refresh()` already calls `getBillingStatus()`; `:90 if (inflight.current)
  await inflight.current` is dead, because `refresh()` awaits its own run promise and
  nulls `inflight.current` in its `finally`; `:93 const latest = await
  getBillingStatus()` then fetches the identical thing a second time. The comment says
  the direct call exists "to avoid stale closure on `status`", which is a real problem —
  `refresh()` writes to state the loop cannot read back. The fix is to have `refresh()`
  resolve with the `BillingStatus` it fetched and let the loop await that, halving the
  calls without reintroducing the stale read.
  - This is the post-purchase reconciliation path, so getting the break condition wrong
    means a golfer who has paid keeps seeing the paywall. Needs a test alongside:
    one fetch per attempt, stops as soon as `can_access_premium`, gives up after 8,
    keeps polling through a transient throw.
  - Surfaced by the eng review of the paywall redesign (2026-08-10). Scoped out of that
    branch to keep it UI-only.
  - Effort: S (human) -> S (CC). Depends on nothing.

## Tooling

- **Guard against test files under `app/` (P3).** expo-router's route context regex
  (`node_modules/expo-router/_ctx.ios.js`) excludes only `+api`, `+html` and
  `+middleware`. Anything else under `app/` becomes a route — so a `*.test.tsx` there
  is registered as a shipped screen and pulls RNTL and the jest globals into the
  production bundle. All 22 current tests live under `features/` or `lib/`, so the repo
  is compliant by convention, not by enforcement. Add a CI step:
  `find app -name '*.test.*' -o -name '*.spec.*' | grep . && exit 1` (or the equivalent
  ESLint rule).
  - Surfaced by the eng review of the tabless-drawer change (2026-08-09): that plan's
    task T9 originally specified `app/(app)/add-focus/upload.test.tsx`. It was moved to
    `features/` instead, which is evidence the convention is not obvious to a reader.
  - Effort: S (human) -> S (CC). Depends on nothing.
