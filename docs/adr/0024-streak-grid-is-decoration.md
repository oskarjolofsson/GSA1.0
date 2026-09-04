# The streak grid is decoration, not a control

Every square in `StreakPanel` used to open that day's sessions. At fourteen columns a square
is ~21px against DESIGN.md's non-negotiable 44px touch floor, and the 3px gutters mean any
`hitSlop` large enough to fix that overlaps its neighbours — a golfer aiming at Tuesday opens
Wednesday. Rather than keep an unreliable target on an element that is deliberately receding
(see ADR-0021 for the demotion), the grid became decoration: `accessibilityElementsHidden` on
the cells and one label on the group.

## Consequences

`DayDetailModal` lost its only entry point and is currently unreachable. Tracked in TODOS.md.

The streak count itself dropped from 48px to 14px and the grid carries the message instead.
Four weeks of squares argues consistency better than one number, and a streak the golfer
cannot work out how to add to is worse than no streak.
