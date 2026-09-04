# Home's four screens are one route, so the flow owns their state

Home, Analysis, Practice and History render conditionally inside `homeFlow`, not as routes
of their own. `HomeScreen` therefore unmounts the moment a practice session starts, so any
state it held would die with it — including which area tab is open, which the golfer would
find reset to the default after every single session, the most common journey in the app.
`selectedArea` lives in `HomeFlow`, which does not unmount, and is deliberately not cleared
by the focus effect: clearing it would move the bug rather than fix it, surviving a practice
session and then dying on the next tab switch.

Starting a session also lives here rather than in `features/practice`. It carries two rules
that have nothing to do with practice — the premium gate, and the 409 the server raises when
the golfer already holds two programs in an area — and a second copy inside the practice
flow is how the two would drift. `continueProgramSession` returns whether a session actually
started; the caller navigates only on true, because handing down a new session does not by
itself move the screen (`useScreenSequence` keeps `currentIndex` in flow-local state).

## Consequences

The drawer's edge-swipe is gated to the Home screen. Because practice renders on this route,
an ungated gesture stays live during a session, so a golfer reaching to scroll a drill gets
the "start a focus" panel over their practice instead. Gating the gesture is the cheap half
of the fix; splitting the four screens into real routes would mean relocating the state this
file owns, for the same protection.

`exitToHome` dismisses back here with `?area=` when the originating flow knew which area a
new focus belongs to (library and coach do; upload cannot, since one analysis can return
issues across several areas), so the golfer lands on the area they just added to.
