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
 * Static, not sticky. Sticky needs scroll state, which means a client component;
 * the entire page is server-rendered with zero JS and that is worth protecting.
 */
export function Nav() {
  return (
    <header className="hero-nav absolute inset-x-0 top-0 z-30 border-b border-sand/20 bg-gradient-to-b from-ink/85 to-ink/55 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          <Image
            src="/true_swing_logo.png"
            alt=""
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
          className="shrink-0 rounded-md bg-gold px-4 py-2 font-sans text-sm font-semibold text-ink transition-colors hover:bg-gold-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Download
        </a>
      </div>
    </header>
  );
}
