import type { SocialId } from "@/content/types";

/**
 * Social icons for the footer row.
 *
 * The Instagram, Facebook and LinkedIn paths are copied verbatim from the
 * legacy footer (frontend/src/layouts/public/components/footer.jsx:86-208),
 * which repeated the same wrapper markup around each one. Here the wrapper
 * lives in SocialLink and only the path differs.
 *
 * Typed as Record<SocialId, ...> so adding a network to SITE.socials without
 * adding an icon is a compile error rather than a blank space in the footer.
 */
const PATHS: Record<SocialId, string> = {
  instagram:
    "M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.75-.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z",
  facebook:
    "M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.2-1.5 1.6-1.5H16.7V5.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6V11H6.7v3h2.8v8h4z",
  discord:
    "M20.3 4.4A19 19 0 0 0 15.7 3l-.2.4a17 17 0 0 1 4 1.3 13.6 13.6 0 0 0-11-.1A18 18 0 0 1 8.5 3.4L8.3 3a19 19 0 0 0-4.6 1.4C1 8.5.3 12.5.6 16.4a19 19 0 0 0 5.7 2.9l.5-.7a12 12 0 0 1-1.8-.9l.4-.3a13.6 13.6 0 0 0 11.6 0l.4.3c-.6.3-1.2.6-1.8.9l.5.7a19 19 0 0 0 5.7-2.9c.4-4.5-.7-8.5-3.5-12zM8.7 14.3c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3zm6.6 0c-1.1 0-2-1-2-2.3s.9-2.3 2-2.3 2 1 2 2.3-.9 2.3-2 2.3z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.846 3.37-1.846 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
};

export function SocialLink({
  id,
  label,
  title,
  href,
}: {
  id: SocialId;
  label: string;
  title: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — ${title}`}
      className="text-sand-dim transition-colors hover:text-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4">
        <path d={PATHS[id]} />
      </svg>
    </a>
  );
}
