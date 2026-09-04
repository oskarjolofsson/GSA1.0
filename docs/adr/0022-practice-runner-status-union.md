# The practice runner has one status union and a resumable retry

`usePracticeRunner` returns a single `PracticeStatus` union rather than separate `loading`
and `error` values. The hook it replaced OR'd five loading sources and four error sources
into two booleans and the screen checked `loading` first, so a failure on the final drill
left `finishing` true forever, `loading` therefore true forever, and the error branch was
never reached: a golfer who had just finished their session sat on a spinner with no button,
and the completion guard blocked any retry. A union makes that state unrepresentable instead
of resolved by the order of two `if`s. `failure` is checked first, and is a variant rather
than a flag, so no future addition to the loading side can hide it again.

The hook is mounted in `practiceFlow`, not in the practice screen. A failed `completeStep`
has to be retryable from the completion screen, by which point the practice screen has
unmounted.

## Consequences

Submitting the last block is three calls — end the drill, end the session, advance the
program — and any one can fail, so the hook tracks which already landed (`drillEndedRef`,
`sessionEndedRef`, `settledRunsRef`, `gradesRef` keyed by run id) and a retry resumes rather
than restarts. Re-ending a drill run that already has a `completed_at` is not something to
find out about in production, and marking a run settled before everything landed is how the
first version blocked its own retry.

A failed program advance does not block the completion screen: the practice happened and the
session is saved, only the schedule did not move. It is surfaced as `advance-failed` with a
retry. The old code logged it to the console and congratulated the golfer anyway, so a plan
that had silently stopped advancing looked exactly like one that was working.
