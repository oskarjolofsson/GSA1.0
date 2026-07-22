import Image from "next/image";
import { HERO } from "@/content/landing";
import { Nav } from "@/components/layout/Nav";
import { AppStoreButton } from "./AppStoreButton";

/**
 * Full-viewport hero, variant D — the photo IS the first screen.
 *
 * Layout notes:
 *  - `min-h-screen` with the photo `absolute inset-0 object-cover`.
 *  - A left-to-right scrim carries the text. Copy sits in the left half where
 *    the scrim is near-opaque; the phone in the photo stays readable on the right.
 *  - `object-position` shifts per breakpoint. The crop that frames the phone at
 *    1440 pushes it off-screen at 375, so mobile pulls focus further right.
 *
 * Motion is pure CSS (see globals.css). The photo animates from 0.55 opacity,
 * never from 0: it is the Largest Contentful Paint element, and fading it in
 * from invisible defers when the browser records it as painted. The motion you
 * actually notice is the staggered text, which is not what gets measured.
 *
 * `priority` + explicit dimensions: this is the LCP image, so it must not be
 * lazy-loaded, and the reserved box prevents layout shift.
 */
export function Hero() {
  return (
    <section className="hero relative flex min-h-screen flex-col overflow-hidden">
      {/* Photo */}
      <div className="hero-photo absolute inset-0 z-0">
        <Image
          src= {HERO.image}
          alt={HERO.photoAlt}
          fill
          priority
          sizes="100vw"
          /* Mobile crops hard horizontally, so the focal point shifts left to
             keep the phone and a hint of the drill screen in frame — at 72% it
             showed only the dark bezel and read as an abstract shape rather
             than an app. Verified at 375px; don't tune one without the other. */
          className="object-cover object-[55%_50%] sm:object-[65%_50%]"
        />
      </div>

      {/* Scrim. Near-opaque on the left so the copy has a surface, clearing to
          the right so the phone and the course stay visible. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(10,15,26,.93)_0%,rgba(10,15,26,.82)_45%,rgba(10,15,26,.60)_100%)] sm:bg-[linear-gradient(90deg,rgba(10,15,26,.97)_0%,rgba(10,15,26,.93)_36%,rgba(10,15,26,.60)_66%,rgba(10,15,26,.40)_100%)]"
      />

      <Nav />

      <div className="relative z-20 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-28 pb-20">
        {/* Kicker above the headline. A <p>, never a heading: an eyebrow that is
            an h2 breaks heading order and misreports structure to screen readers.
            Same token as the "Scroll" label below (sand-dim, uppercase, tracked)
            so it reads as a quiet system element, not a competing line. Sand-dim
            clears AA here (~5:1) because it sits in the near-opaque left scrim,
            unlike over the open photo where the token measured 3.83:1. */}
        <p className="hero-eyebrow mb-4 font-sans text-[11px] font-semibold tracking-[0.18em] text-sand-dim uppercase">
          {HERO.eyebrow}
        </p>

        {/* The only h1 on the page, and it is the positioning line itself. */}
        <h1 className="hero-headline font-display text-4xl leading-[1.05] font-bold tracking-tight text-balance text-sand sm:text-5xl lg:text-6xl">
          {HERO.headline}
        </h1>

        {/* text-sand, not text-sand-dim. Two reasons: over the photo the dim
            token measured 3.83:1 at 375px, below the 4.5 AA floor for body
            text; and this is the support line for the headline, so rendering
            it like a caption undersells it. Everywhere off the photo still
            uses sand-dim. */}
        <p className="hero-sub mt-6 max-w-lg text-lg text-sand sm:text-xl">
          {HERO.support}
        </p>

        <div className="hero-cta mt-9 flex flex-wrap items-center gap-3">
          <AppStoreButton section="hero" />
          <a
            href={HERO.secondaryHref}
            className="inline-flex items-center rounded-md border border-sand/30 px-6 py-4 font-sans text-base font-semibold text-sand transition-colors hover:border-sand/50 hover:bg-sand/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {HERO.secondaryCta}
          </a>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="relative z-20 pb-7 text-center font-sans text-[11px] tracking-[0.18em] text-sand-dim uppercase"
      >
        Scroll
      </div>
    </section>
  );
}
