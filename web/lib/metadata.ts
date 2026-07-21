import type { Metadata } from "next";
import { SITE } from "@/content/site";
import type { Route } from "./routes";

interface PageMeta {
  readonly title: string;
  readonly description: string;
}

/**
 * Per-route titles and descriptions. Kept in one map so lib/metadata.test.ts can
 * assert every route has unique, length-capped copy without importing pages.
 *
 * Title ≤ 60 chars and description ≤ 160 chars — beyond that Google truncates
 * in the SERP, which wastes the only pitch a searcher sees.
 */
export const PAGE_META: Record<Route, PageMeta> = {
  "/": {
    title: "TrueSwing — A practice plan you'll actually stick to",
    description:
      "You already know your swing fault. TrueSwing turns it into an ordered program of range drills and prescribed on-course play, and tracks that you showed up.",
  },
  "/legal/privacy-policy": {
    title: "Privacy Policy — TrueSwing",
    description:
      "How TrueSwing collects, uses and stores your data, including swing videos, account details and analytics.",
  },
  "/legal/terms-and-conditions": {
    title: "Terms & Conditions — TrueSwing",
    description:
      "The terms governing your use of TrueSwing, including subscriptions, acceptable use and limitations of liability.",
  },
};

export function buildMetadata(route: Route): Metadata {
  const meta = PAGE_META[route];
  const canonical = route === "/" ? SITE.url : `${SITE.url}${route}`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title: meta.title,
      description: meta.description,
      url: canonical,
      images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/og-default.png"],
    },
  };
}
