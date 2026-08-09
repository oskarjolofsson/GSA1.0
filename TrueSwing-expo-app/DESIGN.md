# TrueSwing — design system

Derived from `trueswing_brand_book_by_pomelli.pdf` plus the decisions settled in the B2
(practice rating) and C5 (library) design reviews. Written down because those two features
each re-derived the same rules from the PDF independently, and the third time would drift —
the practice screen shipped on `emerald-500` for months precisely because nothing said not to.

The brand book is the source of truth for palette, type and voice. This file is the source of
truth for how they apply on a phone.

---

## Palette

| Token (`tailwind.config.js`) | Hex | Use |
|---|---|---|
| `ink` | `#0A0F1A` | Every screen background. Obsidian Black. |
| `ink-raised` | `#141F30` | The rare raised surface. Prefer air and a rule. |
| `sand` | `#EADFC8` | Primary text. Pastel Cream. **14.15:1 on ink.** |
| `sand-dim` | `#8A8676` | Secondary text. **5.26:1 on ink — passes AA.** |
| `gold` | `#E4C892` | Accent. Doe Brown family. |
| `gold-deep` | `#D2B271` | Pressed state for gold. |
| `danger` | `#E0776B` | Errors only. **6.2:1 on ink-raised.** |

**`danger` is deliberately outside the brand book.** Pomelli lists four colours and none of
them says "this failed". An error rendered in `sand-dim` reads as one more secondary line and
the golfer scrolls past it, which is a worse violation than a hue the PDF never mentioned. It is
warm and desaturated so it sits with the palette rather than shouting, and it is reserved for
failure states — never for emphasis, warnings, or destructive-looking-but-safe actions.

**There is no green in this brand.** Not emerald, not mint, not teal. If you see one, it is
legacy from the pre-brand palette (`bg-[#050816]`, `emerald-600`) and it is a bug.

**Never build a colour with a transparency over ink.** `rgba(232,220,196,.42)` looks like
`sand-dim` and measures 3.3:1 — it fails contrast, and it fails invisibly because nothing
computes the composite for you. Use the token.

**Gold is a stroke or a small-caps label, never a fill.** At most three appearances per
screen. A gold-filled primary button is a SaaS move and reads as someone else's product. The
one exception is a genuinely primary, one-per-screen action — B2's "Log it".

## Type

Fraunces is the **primary** face. Hanken Grotesk is secondary. Both load in
`app/_layout.tsx`; `lib/applyGlobalFont.ts` makes Hanken the default for every text node, so
you set a family only to reach for the serif.

| Role | Family | Size |
|---|---|---|
| Screen heading | `font-display` / `font-display-bold` (Fraunces) | 28-30px, often two lines |
| Item title | Fraunces 600 | 18px |
| Body / secondary | `font-sans` (Hanken) | **13px minimum** |
| Eyebrow | Hanken 500, uppercase, `tracking-[2.6px]` | 9-10px |

**Fraunces earns the screen.** If a heading is set in Hanken while Fraunces does subtitle
duty, the hierarchy is upside down.

**The eyebrow is one token, not a pattern to retype.** `text-[11px] font-semibold uppercase
tracking-[2.5px] text-sand-dim` appears in the practice header, the library landing, the level-two
fork and the focus sheet. Copy the values, not a new approximation — a fifth variant at 10px or
2.6px tracking is how a system stops being one.

**Fraunces numerals carry sequence.** Ordered steps use the serif at 12px in `gold` beside the
step text. A numeral holds its place when a step wraps to three lines, where a dash or bullet
floats loose from the text it belongs to.

**13px is the floor for anything a golfer reads**, because this app is used outdoors in
sunlight. 11px passed review once and should not again.

## Layout

- **Hairline rules, not cards.** The brand book separates with air and 1px lines. A stack of
  bordered pills is the most generic pattern in mobile design. Rules: `rgba(232,220,196,.13)`;
  soft dividers `rgba(232,220,196,.07)`.
- **Cards earn their existence.** Use one when the card *is* the interaction — a tappable
  count tile, an expandable issue card. Not to group text.
- **No gradients.** There is not one in the brand book.
- **Generous vertical air.** Roughly double what feels necessary. The book's own pages are
  ~60% empty and that restraint is the whole aesthetic: "midnight sophistication".
- **Touch targets ≥44px.** Non-negotiable, and the reason the practice screen uses a
  two-column tile grid rather than a row of ten dots.
- **Reserved slots over re-layouts.** When art is coming but not ready (area icons), ship the
  empty slot sized correctly rather than adding it later.

## Navigation chrome

**There is no bottom bar.** Home is the app. The tab bar was deleted in the
tabless-drawer change (2026-08-09) because it gave three destinations equal weight
when only one of them is the product — a golfer opened the app to practise, not to
choose between practising, uploading and reading their own email address.

**The hero's two corners are the whole navigation.**

```
┌──────────────────────────────┐
│ photo                        │
│ (+)                  (avatar)│   42px ring, cream, matched pair
│                              │
│  Hello, Oskar                │
│  Two areas on the go         │
└──────────────────────────────┘

  (+)      opens the focus drawer   accessibilityLabel "Add a focus"
  (avatar) opens profile            accessibilityLabel "Open profile"
```

They are drawn as **peers**: same diameter, same cream stroke, same hitSlop. Not a
primary and a secondary — one is "add something", the other is "that's me", and
neither outranks the other.

**Corner controls are cream, never gold.** Gold is capped at three appearances per
screen and the drawer spends all three on its row icons; both surfaces are visible
at once when the drawer is open, so a gold `+` would be a fourth. It would also
break the pair. This is the general rule: **gold is for content, not chrome.**

**Chrome on a photograph is ringed, not bare.** `heroImages.ts` rotates, so a bare
stroke that reads fine on today's crops disappears on the next bright one. The ring
gives the glyph a body on any image. A bare glyph is only safe on ink.

**The focus drawer holds entry points, nothing else.** Three hairline rows, no
cards, no promoted hero — see `features/addFocus/AddFocusDrawer.tsx`. It is not a
settings menu and not a list of what the golfer already has open; that lives on
home under the area tabs.

**New surfaces get a route, not drawer content, whenever anything gates on focus.**
`useRequirePremiumEntry` fires on route focus, and a drawer does not blur the screen
behind it. A gated flow rendered inside the drawer silently skips its gate.

## Voice

From the book: **Direct, Encouraging, Practical, Honest.** Values: consistency, practicality,
transparency, privacy.

- Say the true thing. "Nothing here yet" beats "Coming soon" when the content genuinely does
  not exist, and beats both when the real cause is a failed request — say that instead.
- Utility language, not mood. "Where do you lose shots?" not "Unlock your potential."
- No exclamation marks, no congratulation for showing up beyond what is earned. The completion
  screen says you did the work; it does not throw confetti.

## Sequence and instructions

Drill instructions are one string, split on periods by
`features/shared/utils/parseInstructionSteps.ts`. It is shared: the practice overlay renders those
steps mid-block, the library sheet renders the same ones before the golfer commits, and the
numbering has to agree.

**The parser is naive on purpose and that constrains authoring.** It splits on every period, so
"roughly 30 to 100 yds. out" becomes two steps and a task written as one flowing sentence stays
one long step. Drill tasks must be authored as step lists. This now matters in two screens rather
than one.

A list of things done in order gets a **rail**: a hairline spine down the left with a small
gold-stroked node per item, filled when that item is open. The rail says "sequence" so no label
has to, and it lets a long list collapse to titles without losing the sense that they connect.

**A set is not a sequence, and it must not borrow the sequence treatment.** Added in the
practice-execution review (2026-08-08), because the rail rule above was about to be applied to
something that is not ordered. A drill's `task` is a sequence — do this, then this — and gets
the rail. A drill's `success_signal` is a **set**: "each ball carries close to its target
distance", "swing length scales with the distance", "the distances ladder cleanly" are all
true at once, in no order. Numbering them, or running a spine down them, tells the golfer to
work through them in turn, which is a lie about the content.

A set gets a **gold-stroked mark per item** — the rail's node without the spine — at 9px,
decorative, `accessibilityElementsHidden`, with the group carrying one
`accessibilityRole="list"` label. The mark holds the left edge when an item wraps to three
lines, which pure air does not, and admin-authored strings have no length limit.

Deciding between them is a content question, not a layout preference: **can the golfer do
item 2 before item 1?** If yes it is a set. If no it is a sequence.

## States

Every screen specifies loading, empty, and error. Empty states are screens, not a `<Text>`:
they name the thing, say one honest sentence about why, and give one way out.

Independent fetches fail independently. A screen that can render from one source must render,
rather than hiding working content behind a full-screen error for the other.

## Accessibility floor

- Body text **≥13px**, contrast **≥4.5:1**. Verify composites, don't eyeball them.
- Touch targets **≥44px**.
- Disabled controls carry `accessibilityState={{ disabled }}`, not just a dimmed style.
- No colour-only signalling. The derived grade reads as a word, not a hue.

## Prior design reviews

| Feature | Board | Approved |
|---|---|---|
| B2 — drill rating | `~/.gstack/projects/oskarjolofsson-GSA1.0/designs/drill-metric-rating-20260802/` | D3 two-column grid + D4 proximity stepper |
| C5 — library | `~/.gstack/projects/oskarjolofsson-GSA1.0/designs/library-area-first-20260804/design-board-v2.html` | A2 rules + gold icon slot |
| Upload flow | `~/.gstack/projects/oskarjolofsson-GSA1.0/designs/upload-flow-rebrand-20260808/design-board.html` | Framing corners, trim header, hairline prompts, progress rail |
| Practice execution | `~/.gstack/projects/oskarjolofsson-GSA1.0/designs/practice-brief-20260808/design-board-v3.html` | B gold marks for the focus set, U1 numbered pair for up-next, V3 progress delta |
| Focus drawer | `~/.gstack/projects/oskarjolofsson-GSA1.0/designs/focus-drawer-20260809/design-board.html` | A hairline rows at equal priority, lucide icons at gold stroke, ringed cream `+` |

## Progress and waiting

**Never show a percentage you cannot compute.** The upload flow shipped a 35-second
client-side timer styled as a progress ring for months; it reached 100% while nothing had
finished, and only then asked the server anything. Split the wait by whether a denominator
exists:

- **Real denominator** (bytes over a network, items in a known list) — show the number.
  `expo-file-system`'s `createUploadTask` gives byte-accurate progress; `fetch` gives none,
  which is the only reason the timer existed.
- **No denominator** (an LLM working, a job with a coarse status) — show the *stage* on a
  rail and an elapsed estimate labelled as an estimate. `Analysis.status` is
  `awaiting_upload | processing | completed | failed` with nothing in between, so
  "Analysing / usually about 40 seconds" is the whole truth available.

One moving element is enough to say "working". A pulsing node on the active rail step does
it without implying precision.

**A number the golfer cannot explain is not progress.** `grooved_count / total_drills` shipped
on the home screen as a bare `4/7` with nothing anywhere in the app saying what moves it. The
practice-execution review (2026-08-08) read the scheduler and found the rule:
`GROOVED_THRESHOLD = 3`, strength starts at 0, and `GRADE_STRENGTH_DELTA` is
`{rough: -1, ok: 0, dialed: +1}` (`backend/core/services/program_service.py:31-36`). So **a
drill fills in after three "Very good" blocks, and an "OK" block moves nothing.**

Two rules follow:

- **Show the movement, not just the total.** When the count changes, mark the newly filled
  segment in `gold` and name what moved: `+1 · Gate Drill filled in`. Derived by capturing
  `grooved_count` at session start and diffing against the `StepAdvance` response — no extra
  request. Use the same verb as the picture: segments *fill*, so drills *fill in*. "Locked in"
  was rejected for saying something the bar does not show.
- **Never caption a grade in a way the scheduler contradicts.** `gradeCaption` said "Solid for
  this drill" for an `ok` block that moves strength by exactly zero. A golfer could practise
  ten OK sessions, watch `2/7` never budge, and have no way to find out why. Captions name the
  consequence: "counts toward this drill" / "no change" / "sets this drill back".

The general rule: if a screen shows a derived number, some screen the golfer can reach has to
say what changes it.
