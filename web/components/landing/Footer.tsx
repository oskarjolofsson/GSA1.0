import Link from "next/link";
import { FOOTER } from "@/content/landing";
import { SITE } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sand/10">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <p className="font-display text-xl font-bold text-sand">
              {SITE.name}
            </p>
            <p className="mt-2 max-w-xs text-sm text-sand-dim">
              {SITE.tagline}
            </p>
          </div>

          <ul className="space-y-3">
            {FOOTER.socials.map((social) => (
              <li key={social.id}>
                <a
                  href={SITE.socials[social.id]}
                  className="font-sans text-sand underline-offset-4 hover:text-gold hover:underline"
                >
                  {social.label}
                </a>
                <span className="text-sand-dim"> — {social.blurb}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-sand/10 pt-8 text-sm text-sand-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE.name}
          </p>
          <ul className="flex gap-6">
            {FOOTER.legal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="underline-offset-4 hover:text-sand hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
