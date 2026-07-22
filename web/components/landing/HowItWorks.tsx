import Image from "next/image";
import { HOW_IT_WORKS } from "@/content/howItWorks";
import { AppStoreButton } from "./AppStoreButton";
import { ScrollCue } from "./ScrollCue";

/**
 * The "how it works" section. Replaces StartWithYourIssue / Program / Proof.
 *
 * Three static cards, image-top / text-bottom, arrows between on desktop. No
 * client JS: everything renders server-side into the static HTML, so the whole
 * story is in the bytes on disk for crawlers (see tests/static-html.test.ts).
 *
 * Anchors: the section carries #start (card 1 is "start with your issue") and
 * card 2 carries #program — both are nav targets (content/nav.ts). Don't drop
 * either without updating the nav and its test.
 *
 * On wide screens the section fills the viewport and centers vertically; on
 * mobile the cards stack at natural height.
 */
export function HowItWorks() {
  return (
    <section
      id="start"
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20 mx-auto flex w-full max-w-6xl flex-col px-6 py-24 md:min-h-screen md:justify-center md:py-16"
    >
      <p className="text-center font-sans text-[11px] font-semibold tracking-[0.18em] text-gold-deep uppercase">
        {HOW_IT_WORKS.eyebrow}
      </p>
      <h2
        id="how-it-works-heading"
        className="mt-4 text-center font-display text-3xl leading-[1.05] font-bold tracking-tight text-balance text-sand sm:text-4xl lg:text-5xl"
      >
        {HOW_IT_WORKS.heading}
      </h2>

      <div className="mt-14 grid gap-5 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-4">
        {HOW_IT_WORKS.steps.map((step, i) => (
          <div key={step.id} className="contents">
            {i > 0 && (
              <div
                aria-hidden="true"
                className="hidden items-center justify-center text-xl text-sand-dim md:flex"
              >
                &rarr;
              </div>
            )}

            <article
              id={step.id === "start" ? undefined : step.id}
              className="flex flex-col overflow-hidden rounded-[20px] border border-sand/15 bg-ink-raised"
            >
              <div className="relative aspect-[16/9] md:aspect-[16/11]">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  style={{ objectPosition: step.objectPosition }}
                />
                {/* Fade the photo down into the card body so the title stays
                    legible over any crop. Ends on the exact card colour. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,15,26,0.15)_0%,rgba(10,15,26,0.55)_70%,#141f30_100%)]"
                />
              </div>

              <div className="p-6 pb-7">
                <h3 className="font-display text-xl leading-tight font-semibold text-sand">
                  <span className="text-gold">{step.n}.</span> {step.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-sand-dim">
                  {step.body}
                </p>
              </div>
            </article>
          </div>
        ))}
      </div>

      <div className="mt-16 mb-4 flex flex-col items-center gap-3">
        <AppStoreButton section="how-it-works" />
        <span className="text-[13px] text-sand-dim">
          {HOW_IT_WORKS.ctaSubline}
        </span>
      </div>

      <ScrollCue href="#faq" label="questions" />
    </section>
  );
}
