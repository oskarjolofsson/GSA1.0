import LegalContentSection from "../components/legalSection.jsx";

export default function PrivacyScreen() {
    return (
        <main className="min-h-screen py-10">
            <LegalContentSection
                header="Privacy Policy"
                subheader="Last updated: May 8th 2026"
                text={`Your privacy matters to us. This Privacy Policy explains how True Swing ("we", "our", "us") collects, uses, stores, and protects your information when you use our website, mobile app, and related services (collectively, the “Service”).`}
            />

            <LegalContentSection
                subheader="Information We Collect"
                text={`We collect the information needed to operate your True Swing account and provide our AI-powered golf analysis service.`}
                points={[
                    "Basic profile details such as name, email address, user ID, and authentication information.",
                    "Uploaded golf swing videos and related media that you choose to submit for analysis.",
                    "AI-generated analysis results, swing feedback, insights, drills, and related practice data.",
                    "Technical information such as device information, IP address, request metadata, logs, and security-related data needed to operate and protect the Service.",
                ]}
            />

            <LegalContentSection
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

            <LegalContentSection
                subheader="AI Processing"
                text={`True Swing uses Google Gemini to provide AI-powered golf swing analysis. When you request an analysis, your uploaded golf swing video and related analysis request may be sent to Gemini for processing. Gemini is used only to generate your swing feedback. We configure Gemini so that your submitted data is not stored by Gemini after processing.`}
            />

            <LegalContentSection
                subheader="Media Storage"
                text={`We use Cloudflare to store and deliver uploaded images, videos, thumbnails, and related media files. This allows us to securely store your swing videos and make them available in your account. Cloudflare may also process technical information such as IP address, request metadata, and security-related information when storing, delivering, or protecting media files.`}
            />

            <LegalContentSection
                subheader="Account and Personal Data Storage"
                text={`We use Supabase to provide authentication, account management, and database storage. Supabase may store information such as your name, email address, user ID, authentication provider information, account data, analysis records, practice data, and other information needed to operate your account.`}
            />

            <LegalContentSection
                subheader="What We Do Not Do"
                text={`We do not sell your personal information. We do not share your personal information, uploaded videos, or AI analysis results with third parties for advertising or marketing purposes. We do not use your uploaded videos or AI analysis results for third-party tracking or targeted advertising.`}
            />

            <LegalContentSection
                subheader="Data Retention"
                text={`We retain your account information, uploaded media, AI-generated analysis results, and related app data while your account remains active, unless you delete the data or request deletion. When you delete your account, associated personal data, uploaded media, and analysis data are deleted or anonymized within a reasonable timeframe, except where retention is required for legal, security, billing, or fraud-prevention purposes.`}
            />

            <LegalContentSection
                subheader="Data Security"
                text={`We use technical and organizational measures designed to protect your information from unauthorized access, alteration, disclosure, or destruction. This includes secure storage, access controls, and encrypted transmission where appropriate. However, no system can be guaranteed to be completely secure.`}
            />

            <LegalContentSection
                subheader="Third-Party Services"
                text={`We use trusted third-party service providers to operate the Service. These providers process data only for the purposes described in this Privacy Policy and on our behalf.`}
                points={[
                    "Google Gemini: used to generate AI-powered golf swing analysis.",
                    "Cloudflare: used for image and video storage, media delivery, infrastructure, and security.",
                    "Supabase: used for authentication, account management, and database storage.",
                ]}
            />

            <LegalContentSection
                subheader="Your Rights"
                text={`You may request access to, correction of, or deletion of your personal information. You can delete your account in the app or contact us for help with privacy-related requests. When your account is deleted, your personal data, uploaded media, and AI-generated analysis data are deleted or anonymized within a reasonable timeframe, except where we are required to retain certain information for legal, security, billing, or fraud-prevention reasons.`}
            />

            <LegalContentSection
                subheader="Children’s Privacy"
                text={`True Swing is not intended for users under the age of 16, or the minimum age required by local law. We do not knowingly collect personal data from minors.`}
            />

            <LegalContentSection
                subheader="Changes to This Policy"
                text={`We may update this Privacy Policy periodically. If we make material changes, we will communicate them through the app or website before they take effect.`}
            />

            <LegalContentSection
                subheader="Contact"
                text={`If you have questions about this Privacy Policy or how your data is handled, contact us at team@trueswing.se.`}
            />
        </main>
    );
}