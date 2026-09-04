# Home has one primary action and exactly three separation tiers

A usability test (2026-08-09) found a golfer who picked an area fine and then could not work
out how to practise: the action was 13px underlined text, the smallest type on a screen whose
largest was a 48px streak count, and all three of the screen's permitted gold appearances sat
on a "Played a round?" row. The hierarchy was inverted and she read it correctly.

Home now reads:

    hero (360px, full bleed)
    area tabs
    ── programs, separated by AIR not rules ──
    each ending in a gold "Start practice" button
    ─────────── the ONE tier-2 rule ───────────
    could also work on          ┐
    ┈┈┈┈┈┈┈┈ hairline ┈┈┈┈┈┈┈┈  │ everything here is
    streak                      │ secondary: sand-dim,
    ┈┈┈┈┈┈┈┈ hairline ┈┈┈┈┈┈┈┈  │ hairlines, no gold
    your swings                 ┘

Three tiers, no more. Between two programs: no rule, 34px of air — they are peers of the same
kind, and a line would say "different kind of thing", which is false. Between items in the
secondary block: a `.07` hairline. Between the primary block and the secondary one: a single
`.13` rule, used ONCE, where the boundary is real. Four of them gave four sections the same
claim on attention as the one thing the golfer came to do.

## Consequences

Secondary items dim with the `text-sand-dim` token, never an opacity layer. A first pass
wrapped them in ~60% opacity and they read as disabled rather than secondary.

An area with nothing open shows the invitation and nothing else — no suggestions, no streak,
no archive. One instruction and one control beats two more things to read that cannot help
yet (`showSecondary` in `HomeScreen`, and `AreaEmptyCard`).

Home does not overscroll. The hero runs full bleed to the top, so an iOS rubber-band would
drag ink above the photograph and pull the greeting off its composition.

The Start action is a gold stroke, never a fill. `SLOTS_PER_AREA = 2`, so `ProgramRow` can
render twice, and DESIGN.md allows a gold fill only for a genuinely primary, one-per-screen
action — the same rule that killed the old add-focus hero panel. A stroke is legal twice, and
the screen's gold then totals exactly three: the selected area tab plus at most two Start
buttons. That budget was paid for by deleting the "Played a round? / Log it" row, which held
two of the three gold appearances while pointing at the least important action.
