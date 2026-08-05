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
