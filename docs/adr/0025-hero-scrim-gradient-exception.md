# The home hero's scrim is a sanctioned gradient, and its controls are cream

DESIGN.md says gradients do not exist in this app. `HomeHero` uses one anyway. The brand book
never anticipated a photograph, and without a scrim the greeting sits on open sky at roughly
2:1 contrast — it fails the 4.5:1 floor, and fails invisibly. This is a legibility device, the
same shape of exception as `danger`, and never a way to make something look nicer.

## Consequences

The hero's two corner controls — `+` (focus drawer) and the avatar (profile) — are the whole
navigation now that the tab bar is gone, so they are drawn as a matched pair: same 42px ring,
same cream. The `+` is cream rather than gold because the drawer it opens spends the screen's
whole gold budget on its row icons and both surfaces are visible at once, and because a gold
`+` beside a cream avatar breaks the pair. `AreaEmptyCard`'s `+` IS gold, which is not drift:
DESIGN.md reserves gold for content, and that one is the screen's only content action.

Both are ringed rather than bare glyphs because `heroImages.ts` rotates: a bare stroke that
survives today's crops vanishes on whichever bright image is added next.

If this exception survives review it belongs written into DESIGN.md, or the next feature
re-derives it and drifts.
