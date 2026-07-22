/**
 * "How it works" — the one section that replaces the old
 * StartWithYourIssue / Program / Proof trio.
 *
 * Modeled on Datafast's "Find … in 3 steps": three static cards, image-top /
 * text-bottom, read in one scan. Everything lives in the static HTML — no
 * client JS, nothing hidden behind a click — so a crawler sees all three steps.
 *
 * The three cards ARE a sequence (1 → 2 → 3), so the numbered titles are honest
 * here. Copy is carried over from the retired constants in content/landing.ts.
 *
 * Card images are the existing lifestyle photos as PLACEHOLDERS. Real app
 * screenshots (the "one thing" screen, a program, the squares grid) drop in
 * later with no layout change — the card media region keeps its aspect ratio.
 */
import { img } from "@/lib/images";

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  heading: "Get better in three steps",

  steps: [
    {
      n: 1,
      id: "start",
      title: "Start with your issue",
      body: "Film a swing, paste your coach's notes, or pick your fault from the library. However you start, you leave with one thing to work on.",
      image: img("Golf-11-1280.webp"),
      /** object-position: keep the phone/drill in frame. */
      objectPosition: "center 30%",
      imageAlt: "A golfer mid-swing on a links course, Flasterbo Golfklubb (Flasterbo GK)",
    },
    {
      n: 2,
      id: "program",
      title: "Get a program, not a drill list",
      body: "An ordered sequence of sessions that adapts to whatever still feels rough, and sends you to the course, not just the range.",
      image: img("hero-1280.webp"),
      objectPosition: "center 25%",
      imageAlt: "A golfer holding a phone showing a TrueSwing practice drill with step-by-step instructions",
    },
    {
      n: 3,
      id: "proof",
      title: "See that you showed up",
      body: "A square for every session you finish, plus re-tests you judge against your own earlier swing.",
      image: img("Golf-12-1280.webp"),
      objectPosition: "center 20%",
      imageAlt: "A golfer at the top of the backswing, seen from the front, on a coastal course, Falsterbo Golfklubb, (Falsterbo GK)",
    },
  ],

  /** Sub-line under the App Store button. */
  ctaSubline: "Free to start. One thing to work on today.",
} as const;
