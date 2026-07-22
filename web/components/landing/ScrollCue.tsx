/**
 * The "Scroll" affordance that sits at the bottom of a section and takes you to
 * the next one.
 *
 * It is a plain anchor, not a button with a scroll handler: the page is
 * server-rendered with zero JS, and an on-page anchor gets smooth scrolling for
 * free from `scroll-behavior: smooth` on <html> (see globals.css). That also
 * means it works with JS disabled and is a real, focusable link for keyboard
 * and screen-reader users — hence the visually-hidden destination in the label.
 *
 * `label` names where it goes ("the problem", "how it works") so the accessible
 * name is "Scroll to the problem" rather than a bare, repeated "Scroll".
 */
export function ScrollCue({ href, label }: { href: string; label: string }) {
  return (
    <div className="relative z-20 flex justify-center pb-7">
      <a
        href={href}
        className="group inline-flex flex-col items-center gap-1.5 rounded-sm px-3 py-1 font-sans text-[11px] tracking-[0.18em] text-sand-dim uppercase transition-colors hover:text-sand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        <span>
          Scroll<span className="sr-only"> to {label}</span>
        </span>
        {/* Chevron nudges down on hover to read as "keep going". Decorative — the
            word "Scroll" already carries the meaning. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 transition-transform group-hover:translate-y-0.5 motion-safe:animate-bounce"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </a>
    </div>
  );
}
