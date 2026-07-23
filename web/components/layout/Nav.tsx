import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/content/nav";
import { SITE } from "@/content/site";

/**
 * Site header. Sits over the full-bleed hero photo.
 *
 * The separator is a hairline PLUS a downward scrim, not a hairline alone. On a
 * photo the bare line washes out wherever the image brightens, and the links
 * lose contrast with it. The scrim gives the nav its own surface so it stays
 * legible over any frame — which matters because the hero image is intended to
 * become video, and video brightness changes shot to shot.
 *
 * Fixed, so it follows the scroll and stays reachable on a long page. This is
 * pure CSS position: fixed — no scroll state and no client component, so the
 * whole page stays server-rendered with zero JS. The gradient + backdrop-blur
 * give the bar its own surface, so it reads cleanly over the hero photo at the
 * top and over the dark sections below once you scroll.
 */
export function Nav() {
  return (
    <header className="hero-nav fixed inset-x-0 top-0 z-30 border-b border-sand/20 bg-gradient-to-b from-ink/90 to-ink/70 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <Image
            src="/true_swing_logo.png"
            alt="TrueSwing"
            width={32}
            height={32}
            priority
            className="size-8 opacity-90"
          />
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-white">True </span>
            <span className="text-sand">Swing</span>
          </span>
        </Link>

        {/* Hidden below sm: three anchors in a 375px bar would crowd the CTA out. */}
        <nav aria-label="Sections" className="hidden gap-7 sm:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-sans text-sm text-sand-dim underline-offset-4 transition-colors hover:text-sand hover:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={SITE.appStoreUrl}
          data-section="nav"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-gold px-4 py-2 font-sans text-sm font-semibold text-ink transition-colors hover:bg-gold-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="currentColor"
          >
            <path d="M16.36 12.78c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.28-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.79.75 3.02.72c1.25-.02 2.04-1.13 2.8-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.45-3.7ZM14.1 5.6c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.77-.97 2.82 1.03.08 2.07-.52 2.71-1.28Z" />
          </svg>
          Download
        </a>
      </div>
    </header>
  );
}
