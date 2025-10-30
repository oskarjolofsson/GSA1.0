import LegalContentSection from "../components/textBox/legalSection.jsx";

export default function Privacy() {
  return (
    <main className="min-h-screen py-10">
      <LegalContentSection
        header="Privacy Policy"
        subheader="Last updated: October 2025"
        text={`Your privacy matters to us. This Privacy Policy explains how True Swing ("we", "our", "us") collects, uses, and protects your information when you use our website, mobile app, and related services (collectively, the “Service”).`}
      />

      <LegalContentSection
        subheader="Information We Collect"
        text={`We only collect essential information required to operate your True Swing account and provide our AI-powered golf analysis service.`}
        points={[
          "Basic profile details such as name, email address, and authentication information.",
          "AI-generated data and insights derived from your uploaded golf swing analyses.",
        ]}
      />

      <LegalContentSection
        subheader="What We Do Not Collect"
        text={`We do not permanently store any raw user input, video uploads, or manual entries. Once processed for analysis, that data is discarded and not retained in our systems.`}
      />

      <LegalContentSection
        subheader="How We Use Your Information"
        text={`We use your profile and AI-generated data solely to:`}
        points={[
          "Provide and improve the True Swing analysis experience.",
          "Display personalized insights and analytics within your account.",
          "Maintain secure authentication and account access.",
        ]}
      />

      <LegalContentSection
        subheader="Data Retention"
        text={`We retain your profile and AI-generated analysis data only while your account remains active. When you delete your account, all associated information is permanently removed from our systems within a reasonable timeframe.`}
      />

      <LegalContentSection
        subheader="Data Security"
        text={`We use encryption and secure storage to protect your information from unauthorized access, alteration, or disclosure. While we take industry-standard measures to protect your data, no system is completely immune to security risks.`}
      />

      <LegalContentSection
        subheader="Third-Party Services"
        text={`We do not sell or share your personal information with third parties for marketing or advertising purposes. Third-party providers we use (such as hosting or analytics tools) process data solely on our behalf.`}
      />

      <LegalContentSection
        subheader="Your Rights"
        text={`You can request deletion of your account at any time. Upon deletion, all profile and AI-generated data will be permanently removed. You may also contact us for access or correction of your information.`}
      />

      <LegalContentSection
        subheader="Children’s Privacy"
        text={`True Swing is not intended for users under the age of 16, or the minimum age required by local law. We do not knowingly collect personal data from minors.`}
      />

      <LegalContentSection
        subheader="Changes to This Policy"
        text={`We may update this Privacy Policy periodically. Changes will be communicated through the app or website at least 30 days before they take effect.`}
      />

      {/* <LegalContentSection
        subheader="Contact Us"
        text={`If you have any questions or concerns about this Privacy Policy, please contact us at:\nsupport@trueswing.app`}
      /> */}
    </main>
  );
}
