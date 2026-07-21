import { PROOF } from "@/content/landing";
import { Section } from "@/components/layout/Section";
import { PhoneFrame } from "./PhoneFrame";

export function Proof() {
  return (
    <Section id="proof" heading={PROOF.heading}>
      <p className="mt-5 max-w-xl text-lg text-sand-dim">{PROOF.body}</p>

      <div className="mt-12 grid items-center gap-12 md:grid-cols-[1fr_auto]">
        <ul className="space-y-8">
          {PROOF.points.map((point) => (
            <li key={point.id}>
              <h3 className="font-display text-lg font-semibold text-gold">
                {point.title}
              </h3>
              <p className="mt-2 max-w-lg text-base leading-relaxed text-sand-dim">
                {point.body}
              </p>
            </li>
          ))}
        </ul>

        <PhoneFrame src="/screenshots/retest.svg" alt={PROOF.screenshotAlt} />
      </div>
    </Section>
  );
}
