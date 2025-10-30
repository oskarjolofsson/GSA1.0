import LegalContentSection from "../components/textBox/legalSection.jsx";

export default function Terms() {
  return (
    <main className="min-h-screen py-10">
      <LegalContentSection
        header="Terms and Conditions"
        text={`Welcome to True Swing. By accessing or using our website, mobile app, and related services (the “Service”), you agree to be bound by these Terms and Conditions (“Terms”). Please read them carefully.
                We provide a platform to help golfers and coaches analyze, store, and review swing data and performance metrics. By using True Swing, you confirm that all information you provide is accurate and that your use complies with applicable laws.`}
      />

      <LegalContentSection
        subheader="Services Provided"
        text={`True Swing provides golf analysis tools, including video upload, swing breakdown, data visualization, and feedback sharing. By using our Service, you gain access to analytics that help you improve your game or assist others in coaching and performance review.`}
        points={[
          "Upload and store swing videos for analysis",
          "Receive performance insights and metrics",
          "Access personalized analytics and history of improvements",
        ]}
      />

      <LegalContentSection
        subheader="Prohibited Content"
        text="You may not upload or share any malicious, unlawful, or infringing content through True Swing. This includes, but is not limited to:"
        points={[
          "Offensive, harassing, or discriminatory material",
          "Unauthorized recordings or materials owned by others",
          "Malicious code or software designed to harm the platform or its users",
        ]}
      />

      <LegalContentSection
        subheader="User Responsibilities"
        text="You are responsible for all activity that occurs under your account and agree to:"
        points={[
          "Use True Swing only for lawful purposes",
          "Respect copyright and data protection laws",
          "Avoid attempting to reverse-engineer, disrupt, or misuse the platform",
        ]}
      />

      <LegalContentSection
        subheader="Data Retention & Deletion"
        text={`True Swing may store user-generated swing videos, analysis data, and related metrics for as long as your account remains active. If you delete your account, all personal data and uploaded content will be removed within a reasonable period in accordance with our Privacy Policy.`}
      />

      {/* <LegalContentSection
        subheader="5. Intellectual Property"
        text={`True Swing claims no ownership over your uploaded content. However, the app’s software, design, analytics engine, and user interface are protected by copyright and other intellectual property laws. You may not copy, modify, or redistribute any part of the Service without our written consent.`}
      /> */}

      <LegalContentSection
        subheader="Limitation of Liability"
        text={`True Swing is provided “as-is.” To the maximum extent permitted by law, True Swing and its owners will not be liable for indirect, incidental, or consequential damages resulting from the use or inability to use the Service. We do not guarantee performance improvement or accuracy of analytical outputs.`}
      />

      <LegalContentSection
        subheader="Governing Law"
        text="These Terms are governed by the laws of Sweden. Disputes will be handled by the competent courts of Sweden unless otherwise required by mandatory consumer law."
      />

      {/* <LegalContentSection
        header="8. Contact"
        text={`Questions, support, or DMCA notices: support@trueswing.app`}
      /> */}
    </main>
  );
}
