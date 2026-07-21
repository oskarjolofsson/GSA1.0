import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/LegalSection";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata("/legal/terms-and-conditions");

/**
 * Ported word-for-word from
 * frontend/src/features/legal/screens/TermsAndConditionsScreen.jsx.
 *
 * Nothing has been added or reworded. Two sections were commented out in the
 * source (Intellectual Property, Contact) and are deliberately left out here —
 * they were never published, so resurrecting them would be a new legal term,
 * not a port.
 *
 * NOTE for the billing decision: the "Payments, Subscriptions & Refunds"
 * section below describes recurring billing in Euros, cancellation "via your
 * account settings", and True Swing charging a payment method directly. That
 * describes web/Stripe billing. If the app moves to Apple in-app purchase,
 * this section becomes inaccurate — Apple owns billing, cancellation and
 * refunds in that model. Revisit alongside the Stripe question in the plan.
 */
export default function TermsAndConditionsPage() {
  return (
    <main>
      <LegalSection
        header="Terms and Conditions"
        text={`Welcome to True Swing. By accessing or using our website, mobile app, and related services (the “Service”), you agree to be bound by these Terms and Conditions (“Terms”). Please read them carefully.
                        We provide a platform to help golfers and coaches analyze, store, and review swing data and performance metrics. By using True Swing, you confirm that all information you provide is accurate and that your use complies with applicable laws.`}
      />

      <LegalSection
        subheader="Services Provided"
        text={`True Swing provides golf analysis tools, including video upload, swing breakdown, data visualization, and feedback sharing. By using our Service, you gain access to analytics that help you improve your game or assist others in coaching and performance review.`}
        points={[
          "Upload and store swing videos for analysis",
          "Receive performance insights and metrics",
          "Access personalized analytics and history of improvements",
        ]}
      />

      <LegalSection
        subheader="Prohibited Content"
        text="You may not upload or share any malicious, unlawful, or infringing content through True Swing. This includes, but is not limited to:"
        points={[
          "Offensive, harassing, or discriminatory material",
          "Unauthorized recordings or materials owned by others",
          "Malicious code or software designed to harm the platform or its users",
        ]}
      />

      <LegalSection
        subheader="User Responsibilities"
        text="You are responsible for all activity that occurs under your account and agree to:"
        points={[
          "Use True Swing only for lawful purposes",
          "Respect copyright and data protection laws",
          "Avoid attempting to reverse-engineer, disrupt, or misuse the platform",
        ]}
      />

      <LegalSection
        subheader="Data Retention & Deletion"
        text={`True Swing may store user-generated swing videos, analysis data, and related metrics for as long as your account remains active. If you delete your account, all personal data and uploaded content will be removed within a reasonable period in accordance with our Privacy Policy.`}
      />

      <LegalSection
        subheader="Limitation of Liability"
        text={`True Swing is provided “as-is.” To the maximum extent permitted by law, True Swing and its owners will not be liable for indirect, incidental, or consequential damages resulting from the use or inability to use the Service. We do not guarantee performance improvement or accuracy of analytical outputs.`}
      />

      <LegalSection
        subheader="Governing Law"
        text="These Terms are governed by the laws of Sweden. Disputes will be handled by the competent courts of Sweden unless otherwise required by mandatory consumer law."
      />

      <LegalSection
        subheader="Payments, Subscriptions & Refunds"
        text={`Certain features of True Swing require a paid subscription or one-time purchase. By subscribing, you authorize True Swing (or its payment provider) to charge your selected payment method on a recurring basis, depending on your chosen plan (monthly or yearly).`}
        points={[
          "All prices are displayed in your Euros and include applicable taxes unless stated otherwise.",
          "Subscription plans renew automatically at the end of each billing period unless cancelled prior to renewal.",
          "You may cancel your subscription at any time via your account settings. Access will remain active until the end of the current billing period.",
          "Payments are non-refundable, except where required by law or explicitly stated otherwise in promotional terms.",
          "In case of failed payments, True Swing reserves the right to suspend or terminate access until payment is successfully processed.",
        ]}
      />
    </main>
  );
}
