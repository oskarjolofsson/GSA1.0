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
 */

export const HERO = {
  headline: "Not an AI coach. A practice plan you'll actually stick to.",
  support: "Stay consistent, and you'll get better.",
  cta: "Download on the App Store",
  /** Screenshot slot — replace with a real device capture. See open deps. */
  screenshotAlt:
    "The TrueSwing home screen showing a contribution graph of completed practice sessions and the current streak",
} as const;

export const PROBLEM = {
  heading: "The problem was never the diagnosis",
  // README.md:21-26, verbatim.
  body: "You've known about your swing fault for years. Someone has already told you what it is. You still grind range balls hoping it clicks, with no way to tell whether any of it is working. The problem was never the diagnosis. It's that nothing closes the loop.",
} as const;

export const ISSUE_SECTION = {
  heading: "Start with your issue",
  // README.md:28-29, verbatim.
  body: "However you get there, you leave with one thing to work on.",
  cards: [
    {
      id: "upload",
      title: "Upload a swing",
      body: "Film one swing on your phone. You get a single thing to work on, not a report.",
    },
    {
      id: "coach",
      title: "Paste your coach's notes",
      body: "Already had the lesson? Your coach's words become a program, in their wording.",
    },
    {
      id: "library",
      title: "Pick from the library",
      body: "Know the fault already? Choose it and start practising today.",
    },
  ],
} as const;

export const PROGRAM = {
  heading: "Get a program, not a drill list",
  // README.md:31-32, verbatim.
  body: "An ordered sequence of sessions that adapts to whatever still feels rough, and sends you to the course, not just the range.",
  /** The differentiator. No competitor prescribes on-course work as a step. */
  emphasis:
    "A grooved move on the range isn't the same as owning it on the first tee. Your program schedules the course as part of the work, not as the reward at the end of it.",
  screenshotAlt:
    "A TrueSwing program step showing the next practice session and its focus",
} as const;

export const PROOF = {
  heading: "See that you showed up",
  // README.md:34-35, verbatim.
  body: "A square for every session you finish, and periodic re-tests where you watch your swing now against your swing then.",
  points: [
    {
      id: "squares",
      title: "A square for every session",
      body: "Earned when you finish the block, not when you rate it. Showing up is the honest metric.",
    },
    {
      id: "retests",
      title: "Re-tests you can actually judge",
      body: "Every few sessions, film the same swing again and compare it side by side with your own earlier footage.",
    },
  ],
  screenshotAlt:
    "A TrueSwing re-test comparing an earlier swing video against a recent one side by side",
} as const;

export const FOOTER = {
  // README.md:39-43, verbatim descriptions.
  socials: [
    { id: "instagram", label: "Instagram", blurb: "swing tips, drills, and what we're building" },
    { id: "facebook", label: "Facebook", blurb: "updates and community" },
    { id: "discord", label: "Discord", blurb: "talk to us and other players" },
  ],
  legal: [
    { href: "/legal/privacy-policy", label: "Privacy Policy" },
    { href: "/legal/terms-and-conditions", label: "Terms & Conditions" },
  ],
} as const;
