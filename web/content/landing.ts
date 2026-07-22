/**
 * Landing page copy.
 *
 * Most of this is lifted VERBATIM from the root README.md, which already
 * carries the approved wording — including the problem block that sits
 * commented out at README.md:21-26. Prefer editing in one place: if you change
 * the pitch, change it here and in the README together.
 *
 * The locked position: an adherence promise, not an accuracy promise. AI stays
 * backstage. Never lead with "AI swing analysis".
 *
 * The start / program / proof copy that used to live here (ISSUE_SECTION,
 * PROGRAM, PROOF) moved to content/howItWorks.ts when those three sections were
 * merged into one "how it works" section.
 */

import { img } from "@/lib/images";

export const HERO = {
  /** Quiet kicker above the headline. Deliberately low-key (sand-dim, not gold):
      it states the positioning without letting the page LEAD with AI — the
      locked position below keeps AI backstage. Keep it short; the headline wins. */
  eyebrow: "Not an AI coach",
  headline: "A practice plan you'll actually stick to.",
  support: "Stay consistent, and you'll get better.",
  cta: "Download on the App Store",
  /** Secondary action. Scrolls rather than leaving the page. */
  secondaryCta: "See how it works",
  secondaryHref: "#start",
  /**
   * Full-bleed hero photo. Cropped from docs/images/media/README_image.png past
   * the baked-in TRUE SWING lockup (ink ends around x=850) — without that crop
   * the wordmark prints twice, once in the photo and once in the nav.
   * Shipped as WebP: the source PNG is 1.6MB, this is 38KB, and
   * `images.unoptimized: true` means Next converts nothing for us.
   */
  photoAlt:
    "A golfer holding a phone on the course, showing a TrueSwing practice drill with step-by-step instructions",
  image: img("Golf-19-1280.webp"),
} as const;

export const PROBLEM = {
  heading: "The problem was never the diagnosis",
  // README.md:21-26, verbatim.
  body: "You've known about your swing fault for years. Someone has already told you what it is. You still grind range balls hoping it clicks, with no way to tell whether any of it is working. The problem was never the diagnosis. You just didn't have the correct practice plan.",

} as const;

/**
 * Footer, variant D — four columns with the App Store CTA in the brand block.
 *
 * Ported from the legacy footer at
 * frontend/src/layouts/public/components/footer.jsx, which used
 * Brand | PRODUCT | RESOURCES | LEGAL. PRODUCT there held a single /pricing
 * link; that page doesn't exist here, so it holds two on-page anchors instead.
 * Three anchors read as filler, two earn the column.
 *
 * The three-column variant was rejected after rendering: giving the brand block
 * 2fr left ~230px of dead space beside it. Mockups:
 * ~/.gstack/projects/oskarjolofsson-GSA1.0/designs/footer-variants-20260721/
 */
export const FOOTER = {
  columns: [
    {
      id: "product",
      heading: "Product",
      links: [
        { href: "#start", label: "How it works" },
        { href: "#faq", label: "Questions" },
      ],
    },
    {
      id: "resources",
      heading: "Resources",
      links: [
        { href: "mailto:CONTACT_EMAIL", label: "Contact" },
        { href: "mailto:CONTACT_EMAIL", label: "Support" },
      ],
    },
    {
      id: "legal",
      heading: "Legal",
      links: [
        { href: "/legal/privacy-policy", label: "Privacy Policy" },
        { href: "/legal/terms-and-conditions", label: "Terms" },
      ],
    },
  ],

  /**
   * Order matters — this is the visual order of the icon row.
   * Descriptions from README.md:39-43 become the accessible labels.
   */
  socials: [
    { id: "instagram", label: "Instagram", title: "swing tips, drills, and what we're building" },
    { id: "facebook", label: "Facebook", title: "updates and community" },
    { id: "discord", label: "Discord", title: "talk to us and other players" },
    { id: "linkedin", label: "LinkedIn", title: "company updates" },
  ],

  /** Kept verbatim from the old footer. The only personality in the chrome. */
  madeIn: "Shipped from 🇸🇪",
  owner: "Oskar O.",
} as const;

/** `mailto:CONTACT_EMAIL` is substituted at render time from SITE.contactEmail. */
export const CONTACT_EMAIL_TOKEN = "CONTACT_EMAIL";
