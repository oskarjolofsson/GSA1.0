/**
 * THE PALETTE. One definition, two consumers.
 *
 * `tailwind.config.js` requires this for the `bg-ink` / `text-sand-dim` class tokens, and
 * app code imports it for the places a className cannot reach: a `color` prop on a
 * lucide icon, `colors` on a LinearGradient, `iconColor` on the native tab bar. Those take
 * raw values, not classes, which is why hex literals kept reappearing in components.
 *
 * PLAIN CommonJS ON PURPOSE. `tailwind.config.js` is loaded by Node at build time, long
 * before Babel or Metro exist, so it cannot import a `.ts` file. Keep this `.js` with
 * `module.exports` or the Tailwind build breaks. App code imports it normally --
 * `allowJs` and `esModuleInterop` come from `expo/tsconfig.base`.
 *
 * Keys match the Tailwind token names exactly, so `bg-ink-raised` is `colors['ink-raised']`.
 * Contrast ratios and the rules for using each one live in DESIGN.md; changing a value here
 * changes it everywhere, including ratios that doc states as measured facts.
 */

const colors = {
  ink: '#0A0F1A', // Every screen background. Obsidian Black.
  'ink-raised': '#141F30', // The rare raised surface.
  sand: '#EADFC8', // Primary text. 14.15:1 on ink.
  'sand-dim': '#8A8676', // Secondary text. 5.26:1 on ink -- passes AA.
  gold: '#E4C892', // Accent. Stroke or small-caps label, never a fill.
  'gold-deep': '#D2B271', // Pressed state for gold.
  danger: '#E0776B', // Errors only. 6.2:1 on ink-raised.

  // Activity-grid greens. DESIGN.md says the brand has no green; these predate that rule
  // and are confined to the contribution heatmap. Do not reach for them elsewhere.
  'grid-low': '#39705A',
  'grid-high': '#6FA98A',
};

module.exports = colors;
