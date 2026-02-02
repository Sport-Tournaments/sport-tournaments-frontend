import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - tournamente.com',
  description: 'Terms and conditions for using the tournamente.com tournament management platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-xl text-[#dbeafe]">
            Last updated: January 14, 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg p-8 space-y-8">
          {/* Company Information */}
          <section className="bg-[#dbeafe] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Information</h2>
            <div className="text-gray-700 space-y-1">
              <p><strong>SPORT INTELLIGENCE TECHNOLOGY S.R.L.</strong></p>
              <p>CUI: 53125536</p>
              <p>Trade Registry: J2025098025007</p>
              <p>EUID: ROONRC.J2025098025007</p>
              <p>Address: Str. Independenței, Nr. 70, Ap. 1, Brașov, County Brașov, Romania</p>
            </div>
          </section>

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              Welcome to tournamente.com, operated by SPORT INTELLIGENCE TECHNOLOGY S.R.L. By accessing or using our platform, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-gray-700">
              These Terms apply to all users of the platform, including tournament organizers, clubs, teams, players, and spectators.
            </p>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
            <ul className="space-y-2 text-gray-700">
              <li><strong>"Platform"</strong> refers to the tournamente.com website and services</li>
              <li><strong>"User"</strong> means any person who accesses or uses the Platform</li>
              <li><strong>"Organizer"</strong> means a user who creates and manages tournaments</li>
              <li><strong>"Participant"</strong> means teams, clubs, or players participating in tournaments</li>
              <li><strong>"Content"</strong> includes text, images, videos, and data uploaded to the Platform</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Eligibility</h3>
            <p className="text-gray-700 mb-4">
              You must be at least 13 years old to create an account. Users under 16 require parental consent. By creating an account, you represent that you meet these requirements.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
            <p className="text-gray-700 mb-3">You agree to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Account Termination</h3>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or harmful activities.
            </p>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Prohibited Activities</h3>
            <p className="text-gray-700 mb-3">You may not:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Upload malicious code or viruses</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use automated systems to access the Platform</li>
              <li>Impersonate others or provide false information</li>
              <li>Engage in fraudulent payment activities</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Content Standards</h3>
            <p className="text-gray-700 mb-3">All content you upload must:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Be accurate and not misleading</li>
              <li>Not contain offensive, discriminatory, or inappropriate material</li>
              <li>Not violate any third-party rights</li>
              <li>Comply with applicable age restrictions and content ratings</li>
            </ul>
          </section>

          {/* Tournament Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Tournament Management Services</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Organizer Responsibilities</h3>
            <p className="text-gray-700 mb-3">As a tournament organizer, you agree to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Provide accurate tournament information</li>
              <li>Honor all registrations in accordance with your published rules</li>
              <li>Handle participant data responsibly and in compliance with privacy laws</li>
              <li>Resolve disputes fairly and transparently</li>
              <li>Process refunds according to your stated refund policy</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Participant Responsibilities</h3>
            <p className="text-gray-700 mb-3">As a tournament participant, you agree to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide accurate registration information</li>
              <li>Comply with tournament rules and regulations</li>
              <li>Respect other participants and organizers</li>
              <li>Pay all applicable fees on time</li>
              <li>Honor your commitment to participate</li>
            </ul>
          </section>

          {/* Payment Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Payment Terms</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Platform Fees</h3>
            <p className="text-gray-700 mb-4">
              We charge subscription fees for premium features as outlined in our Pricing page. All fees are non-refundable unless otherwise stated.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Tournament Fees</h3>
            <p className="text-gray-700 mb-4">
              Organizers set their own tournament registration fees. We process these payments and may charge a transaction fee. Payment processing is subject to our Payment Processor's terms.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Refunds</h3>
            <p className="text-gray-700">
              Refund policies for tournament fees are determined by individual organizers. Platform subscription refunds are processed according to our Refund Policy.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Our Rights</h3>
            <p className="text-gray-700 mb-4">
              The Platform and its original content, features, and functionality are owned by tournamente.com and are protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you upload. By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Platform.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Copyright Infringement</h3>
            <p className="text-gray-700">
              We respect intellectual property rights. If you believe your work has been infringed, please contact us at copyright@tournamente.com with details of the alleged infringement.
            </p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Limitations</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Service Availability</h3>
            <p className="text-gray-700 mb-4">
              We provide the Platform "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted or error-free service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Third-Party Content</h3>
            <p className="text-gray-700 mb-4">
              We are not responsible for content uploaded by users or accessible through third-party links. Users access third-party content at their own risk.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Limitation of Liability</h3>
            <p className="text-gray-700">
              To the maximum extent permitted by law, tournamente.com shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold tournamente.com harmless from any claims, damages, losses, or expenses (including legal fees) arising from your violation of these Terms or your use of the Platform.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Governing Law</h3>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of Romania, without regard to conflict of law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts of Brașov, Romania.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Arbitration</h3>
            <p className="text-gray-700">
              Any disputes arising from these Terms shall be resolved through binding arbitration, except where prohibited by law. You waive your right to participate in class action lawsuits.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or platform notification. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>
            <p className="text-gray-700">
              We may terminate or suspend your account and access to the Platform immediately, without prior notice, for any violation of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Company:</strong> SPORT INTELLIGENCE TECHNOLOGY S.R.L.</p>
              <p className="text-gray-700"><strong>Email:</strong> contact@tournamente.com</p>
              <p className="text-gray-700"><strong>Address:</strong> Str. Independenței, Nr. 70, Ap. 1, Brașov, County Brașov, Romania</p>
              <p className="text-gray-700"><strong>CUI:</strong> 53125536</p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-[#dbeafe] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700">
              By using tournamente.com, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
