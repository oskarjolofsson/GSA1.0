import { ISSUE_SECTION } from "@/content/landing";
import { Section } from "@/components/layout/Section";

/**
 * Three seed paths into the same program engine. The point of the section is
 * that they converge: however you arrive, you leave with ONE thing to work on.
 */
export function StartWithYourIssue() {
  return (
    <Section id="start" heading={ISSUE_SECTION.heading}>
      <p className="mt-5 max-w-xl text-lg text-sand-dim">
        {ISSUE_SECTION.body}
      </p>

      <ul className="mt-12 grid gap-5 sm:grid-cols-3">
        {ISSUE_SECTION.cards.map((card) => (
          <li
            key={card.id}
            className="rounded-lg border border-sand/20 bg-ink-raised/50 p-6"
          >
            <h3 className="font-display text-lg font-semibold text-gold">
              {card.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-sand-dim">
              {card.body}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
