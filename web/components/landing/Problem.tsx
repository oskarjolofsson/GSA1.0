import { PROBLEM } from "@/content/landing";
import { ScrollCue } from "./ScrollCue";

/**
 * The emotional hook, and the section that earns the most vertical space.
 *
 * Set larger than body copy on purpose: this paragraph is the moment a 15-5
 * handicap reading it recognises themselves. Everything after it is mechanism.
 */
export function Problem() {
  return (
    <section
      id="problem"
      aria-labelledby="problem-heading"
      className="scroll-mt-20 border-y border-sand/20 bg-ink-raised/30"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-32">
        <h2
          id="problem-heading"
          className="font-display text-3xl font-bold tracking-tight text-balance text-gold sm:text-4xl"
        >
          {PROBLEM.heading}
        </h2>

        <p className="mt-8 text-xl leading-relaxed text-pretty text-sand sm:text-2xl sm:leading-relaxed">
          {PROBLEM.body}
        </p>
      </div>

      <ScrollCue href="#start" label="how it works" />
    </section>
  );
}
