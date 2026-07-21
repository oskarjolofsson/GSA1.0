import { SITE } from "@/content/site";

/**
 * The only conversion event on this site.
 *
 * Plausible's outbound-link script (loaded in app/layout.tsx) tracks clicks on
 * external links automatically, so this needs no onClick handler and the page
 * stays a server component with zero JavaScript. The `data-section` attribute
 * is picked up as a custom property so you can see WHICH section converts,
 * which is the number that tells you whether the hero or the program pitch is
 * doing the work.
 */
export function AppStoreButton({
  section,
  className = "",
}: {
  section: string;
  className?: string;
}) {
  return (
    <a
      href={SITE.appStoreUrl}
      data-section={section}
      className={`inline-flex items-center gap-3 rounded-full bg-gold px-7 py-4 font-sans text-base font-semibold text-ink transition-colors hover:bg-gold-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${className}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-6"
        fill="currentColor"
      >
        <path d="M16.36 12.78c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.28-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.6-.75 3-.75s1.79.75 3.02.72c1.25-.02 2.04-1.13 2.8-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.45-3.7ZM14.1 5.6c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.77-.97 2.82 1.03.08 2.07-.52 2.71-1.28Z" />
      </svg>
      {/* Placeholder until the real App Store URL lands — see content/site.ts */}
      Download on the App Store
    </a>
  );
}
