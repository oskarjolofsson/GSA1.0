import { FAQ } from "@/content/faq";

/**
 * Native <details>/<summary>. No "use client", no JavaScript.
 *
 * Google indexes collapsed <details> content, so the crawler sees every answer
 * in the static HTML either way. Native buys free keyboard and screen-reader
 * semantics, and find-on-page auto-expands the matching item. The cost is that
 * height can't be animated; `interpolate-size` handles it where supported and
 * it snaps elsewhere, which is the better trade than shipping a client bundle.
 *
 * `name="faq"` makes them mutually exclusive without any script.
 */
export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="mx-auto w-full max-w-3xl px-6 py-24"
    >
      <h2
        id="faq-heading"
        className="font-display text-3xl font-bold text-sand sm:text-4xl"
      >
        Questions
      </h2>

      <div className="mt-10 divide-y divide-sand/10 border-y border-sand/10">
        {FAQ.map((item) => (
          <details key={item.id} id={item.id} name="faq" className="group py-5">
            <summary className="flex items-start justify-between gap-6 text-left">
              <h3 className="font-sans text-lg font-medium text-sand">
                {item.q}
              </h3>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="mt-1 size-5 shrink-0 text-gold transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              >
                <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" />
              </svg>
            </summary>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-sand-dim">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
