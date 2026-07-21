import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/LegalSection";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata("/legal/privacy-policy");

/**
 * Ported faithfully from frontend/src/features/legal/screens/PrivacyScreen.jsx.
 *
 * Two deliberate changes from the original, both reviewable in isolation:
 *   1. "Last updated" moved from May 17th 2026 to July 21st 2026 — the date had
 *      gone stale and this edit is a material change.
 *   2. Plausible Analytics added: a new "Analytics" section and an entry in the
 *      Third-Party Services list. The site now loads plausible.io, so it has to
 *      be disclosed here.
 *
 * Everything else is word-for-word. If you change wording, change it here — this
 * page is the published policy, not a summary of one.
 */
export default function PrivacyPolicyPage() {
  return (
    <main>
      <LegalSection
        header="Privacy Policy"
        subheader="Last updated: July 21st 2026"
        text={`Your privacy matters to us. This Privacy Policy explains how True Swing ("we", "our", "us") collects, uses, stores, and protects your information when you use our website, mobile app, and related services (collectively, the “Service”).`}
      />

      <LegalSection
        subheader="Information We Collect"
        text={`We collect the information needed to operate your True Swing account and provide our AI-powered golf analysis service.`}
        points={[
          "Basic profile details such as name, email address, user ID, and authentication information.",
          "Uploaded golf swing videos and related media that you choose to submit for analysis.",
          "AI-generated analysis results, swing feedback, insights, drills, and related practice data.",
          "Technical information such as device information, IP address, request metadata, logs, and security-related data needed to operate and protect the Service.",
        ]}
      />

      <LegalSection
        subheader="How We Use Your Information"
        text={`We use your information solely to operate, secure, and improve the True Swing service.`}
        points={[
          "Create and manage your True Swing account.",
          "Authenticate users and maintain secure account access.",
          "Upload, store, and display your golf swing videos and related media.",
          "Generate AI-powered golf swing analysis and personalized feedback.",
          "Display your previous analyses, insights, drills, and practice history within your account.",
          "Maintain, debug, secure, and improve the reliability of the Service.",
        ]}
      />

      <LegalSection
        subheader="AI Processing"
        text={`True Swing uses Google Gemini to provide AI-powered golf swing analysis. When you request an analysis, your uploaded golf swing video and related analysis request may be sent to Gemini for processing. Gemini is used only to generate your swing feedback. We configure Gemini so that your submitted data is not stored by Gemini after processing.`}
      />

      <LegalSection
        subheader="How AI-Generated Content is Labeled"
        text={`All swing analysis and feedback provided by True Swing is generated automatically by artificial intelligence (Google Gemini). AI-generated analysis is clearly identified as such within the app. This content is not reviewed or verified by a human coach before delivery and should not be treated as professional instruction. Users are encouraged to use AI feedback as a supplementary tool alongside qualified coaching.`}
      />

      <LegalSection
        subheader="Media Storage"
        text={`We use Cloudflare to store and deliver uploaded images, videos, thumbnails, and related media files. This allows us to securely store your swing videos and make them available in your account. Cloudflare may also process technical information such as IP address, request metadata, and security-related information when storing, delivering, or protecting media files.`}
      />

      <LegalSection
        subheader="Account and Personal Data Storage"
        text={`We use Supabase to provide authentication, account management, and database storage. Supabase may store information such as your name, email address, user ID, authentication provider information, account data, analysis records, practice data, and other information needed to operate your account.`}
      />

      {/* NEW SECTION — added with the trueswing.se marketing site. */}
      <LegalSection
        subheader="Analytics"
        text={`We use Plausible Analytics to understand how our website is used. Plausible is a privacy-focused analytics service that does not use cookies and does not collect or store any personal information. It records aggregate data such as page views, referring sites, approximate country, device type, and whether visitors followed the link to the App Store. This data cannot be used to identify you and is not linked to your True Swing account. Analytics are used on our website only, not inside the mobile app.`}
      />

      <LegalSection
        subheader="What We Do Not Do"
        text={`We do not sell your personal information. We do not share your personal information, uploaded videos, or AI analysis results with third parties for advertising or marketing purposes. We do not use your uploaded videos or AI analysis results for third-party tracking or targeted advertising.`}
      />

      <LegalSection
        subheader="Data Retention"
        text={`We retain your account information, uploaded media, AI-generated analysis results, and related app data while your account remains active, unless you delete the data or request deletion. When you delete your account, associated personal data, uploaded media, and analysis data are deleted or anonymized within a reasonable timeframe, except where retention is required for legal, security, billing, or fraud-prevention purposes.`}
      />

      <LegalSection
        subheader="Data Security"
        text={`We use technical and organizational measures designed to protect your information from unauthorized access, alteration, disclosure, or destruction. This includes secure storage, access controls, and encrypted transmission where appropriate. However, no system can be guaranteed to be completely secure.`}
      />

      <LegalSection
        subheader="Third-Party Services"
        text={`We use trusted third-party service providers to operate the Service. These providers process data only for the purposes described in this Privacy Policy and on our behalf.`}
        points={[
          "Google Gemini: used to generate AI-powered golf swing analysis.",
          "Cloudflare: used for image and video storage, media delivery, infrastructure, and security.",
          "Supabase: used for authentication, account management, and database storage.",
          "Plausible Analytics: used for privacy-focused, cookie-free website analytics.",
        ]}
      />

      <LegalSection
        subheader="Your Rights"
        text={`You may request access to, correction of, or deletion of your personal information. You can delete your account in the app or contact us for help with privacy-related requests. When your account is deleted, your personal data, uploaded media, and AI-generated analysis data are deleted or anonymized within a reasonable timeframe, except where we are required to retain certain information for legal, security, billing, or fraud-prevention reasons.`}
      />

      <LegalSection
        subheader="Children’s Privacy"
        text={`True Swing is not intended for users under the age of 16, or the minimum age required by local law. We do not knowingly collect personal data from minors.`}
      />

      <LegalSection
        subheader="Changes to This Policy"
        text={`We may update this Privacy Policy periodically. If we make material changes, we will communicate them through the app or website before they take effect.`}
      />

      <LegalSection
        subheader="Contact"
        text={`If you have questions about this Privacy Policy or how your data is handled, contact us at team@trueswing.se.`}
      />
    </main>
  );
}
