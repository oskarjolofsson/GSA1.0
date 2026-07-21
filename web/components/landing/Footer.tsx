import Image from "next/image";
import Link from "next/link";
import { FOOTER, CONTACT_EMAIL_TOKEN } from "@/content/landing";
import { SITE } from "@/content/site";
import type { SocialId } from "@/content/types";
import { AppStoreButton } from "./AppStoreButton";
import { SocialLink } from "./SocialIcons";

/**
 * Footer, variant D.
 *
 * Four columns like the legacy footer, with the App Store CTA inside the brand
 * block. The grid is 1.5fr for the brand and 1fr for each link column — the
 * uneven split is deliberate. An even 2fr/1fr/1fr left roughly 230px of dead
 * space beside the brand, which is visible in
 * designs/footer-variants-20260721/03-variant-b.png.
 */
export function Footer() {
  const year = new Date().getFullYear();

  // Content keeps a token so the address lives in exactly one place (SITE).
  const resolveHref = (href: string) =>
    href.replace(CONTACT_EMAIL_TOKEN, SITE.contactEmail);

  return (
    <footer className="border-t border-sand/20">
      <div className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr] sm:gap-8">
          {/* Brand block */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/true_swing_logo.png"
                alt=""
                width={40}
                height={40}
                className="size-10 opacity-90"
              />
              <span className="font-display text-xl font-bold tracking-tight">
                <span className="text-white">True </span>
                <span className="text-sand">Swing</span>
              </span>
            </Link>

            <p className="mt-3 max-w-[15rem] text-sm leading-relaxed text-sand-dim">
              {SITE.tagline}
            </p>

            <AppStoreButton section="footer" className="mt-5 px-5 py-3 text-sm" />
          </div>

          {/* Link columns */}
          {FOOTER.columns.map((column) => (
            <nav key={column.id} aria-labelledby={`footer-${column.id}`}>
              <h2
                id={`footer-${column.id}`}
                className="font-sans text-xs font-semibold tracking-[0.14em] text-white uppercase"
              >
                {column.heading}
              </h2>
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-sm text-sand-dim underline-offset-4 transition-colors hover:text-sand hover:underline"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={resolveHref(link.href)}
                        className="text-sm text-sand-dim underline-offset-4 transition-colors hover:text-sand hover:underline"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Lower bar — structure kept from the legacy footer. */}
      <div className="border-t border-sand/20">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-sand-dim sm:flex-row">
          <p>
            {FOOTER.madeIn} · © {year} {FOOTER.owner}
          </p>

          <ul className="flex items-center gap-4">
            {FOOTER.socials.map((social) => (
              <li key={social.id} className="flex">
                <SocialLink
                  id={social.id as SocialId}
                  label={social.label}
                  title={social.title}
                  href={SITE.socials[social.id as SocialId]}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
