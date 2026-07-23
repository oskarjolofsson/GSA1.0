import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { SITE } from "@/content/site";
import { buildMetadata } from "@/lib/metadata";
import { JsonLd } from "@/lib/seo/JsonLd";
import { organizationSchema, softwareApplicationSchema } from "@/lib/seo/schemas";
import "./globals.css";

/**
 * Self-hosted via next/font so there is no render-blocking round trip to
 * Google. The `variable` names are consumed by the @theme inline block in
 * globals.css.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-fraunces",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  ...buildMetadata("/"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/true_swing_logo.png",
  },
  other: {
    // Smart App Banner: gives iOS Safari visitors a native install prompt.
    "apple-itunes-app": `app-id=${SITE.appStoreId}`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable}`}>
      <head>
        <JsonLd schema={organizationSchema()} />
        <JsonLd schema={softwareApplicationSchema()} />
        {/*
          Plausible: privacy-first, no cookies, so no consent banner is needed.
          The CSP in the Caddyfile MUST allowlist plausible.io — if it does not,
          this script is blocked silently and the site ships unmeasurable.
        */}
        <script
          defer
          data-domain="trueswing.se"
          src="https://plausible.io/js/script.outbound-links.js"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
