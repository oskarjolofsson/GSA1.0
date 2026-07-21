import { FAQ } from "@/content/faq";
import { SITE } from "@/content/site";

/**
 * Pure functions: data in, plain objects out. No rendering, so they are
 * trivially unit-testable, and because they read the same content/ modules the
 * components read, the schema cannot describe something the page doesn't show.
 */

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/og-default.png`,
    sameAs: [
      SITE.socials.instagram,
      SITE.socials.facebook,
      SITE.socials.discord,
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

/**
 * SoftwareApplication is what wins the app rich result. `offers` is deliberately
 * omitted while the price is unconfirmed — publishing a price here that doesn't
 * match the App Store is worse than publishing none, because Google will show it.
 */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    description: SITE.description,
    operatingSystem: "iOS",
    applicationCategory: "HealthAndFitnessApplication",
    url: SITE.appStoreUrl,
  };
}

export function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
