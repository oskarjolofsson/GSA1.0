import { PROGRAM } from "@/content/landing";
import { PhoneFrame } from "./PhoneFrame";

/**
 * The differentiator, and the section a competitor cannot copy-paste.
 *
 * Everyone else stops at "here are your drills". The on-course prescription is
 * the claim worth making loudest, so `emphasis` is styled as a pull quote
 * rather than buried in body copy.
 */
export function Program() {
  return (
    <section
      id="program"
      aria-labelledby="program-heading"
      className="border-y border-sand/20 bg-ink-raised/30"
    >
      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-24 sm:py-28 md:grid-cols-[1fr_auto]">
        <div>
          <h2
            id="program-heading"
            className="font-display text-3xl font-bold tracking-tight text-balance text-sand sm:text-4xl"
          >
            {PROGRAM.heading}
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-dim">
            {PROGRAM.body}
          </p>

          <blockquote className="mt-8 max-w-xl border-l-2 border-gold pl-5">
            <p className="text-lg leading-relaxed text-pretty text-sand">
              {PROGRAM.emphasis}
            </p>
          </blockquote>
        </div>

        <PhoneFrame src="/screenshots/program.svg" alt={PROGRAM.screenshotAlt} />
      </div>
    </section>
  );
}
