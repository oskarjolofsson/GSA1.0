import { JsonLd } from "@/lib/seo/JsonLd";
import { faqPageSchema } from "@/lib/seo/schemas";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { StartWithYourIssue } from "@/components/landing/StartWithYourIssue";
import { Program } from "@/components/landing/Program";
import { Proof } from "@/components/landing/Proof";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { AppStoreButton } from "@/components/landing/AppStoreButton";

/**
 * The landing page. Sections are composed here in scroll order.
 *
 * <Pricing /> is deliberately NOT imported. The component and its tests exist,
 * but two conflicting prices live in the legacy codebase (EUR 14.99 in
 * prices.tsx, EUR 9 in PricingPage.tsx) and neither is confirmed. Adding the
 * import here is the single edit that publishes it — see content/pricing.ts for
 * the full checklist. tests/static-html.test.ts fails if the price leaks in.
 */
export default function Home() {
  return (
    <>
      <JsonLd schema={faqPageSchema()} />

      <main>
        <Hero />
        <Problem />
        <StartWithYourIssue />
        <Program />
        <Proof />
        <Faq />

        {/* Closing CTA: the FAQ is where a convinced reader finishes, so give
            them somewhere to go without scrolling back to the hero. */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-24 text-center">
          <AppStoreButton section="footer-cta" />
        </section>
      </main>

      <Footer />
    </>
  );
}
