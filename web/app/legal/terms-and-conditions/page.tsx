import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/LegalSection";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata("/legal/terms-and-conditions");

/**
 * The published terms, not a summary — edit the wording here.
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
        text={`Paid features of True Swing are sold as auto-renewing subscriptions through the Apple App Store and Google Play. Apple or Google is the merchant of record: they take the payment, hold the payment method, and process any refund. True Swing never receives or stores your card details.`}
        points={[
          "Prices are shown in the App Store or Google Play at purchase, in your local currency, including applicable taxes.",
          "Subscriptions renew automatically at the end of each billing period unless cancelled at least 24 hours before renewal.",
          "Cancel at any time in your App Store or Google Play subscription settings — not in True Swing, which cannot cancel or refund on your behalf. Access remains active until the end of the paid period.",
          "Refunds are handled by Apple or Google under their policies. Direct refund requests to them.",
          "If a renewal payment fails, the store may suspend the subscription and access to paid features ends.",
        ]}
      />
    </main>
  );
}
