import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - tournamente.com',
  description: 'Learn how tournamente.com collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-indigo-100">
            Last updated: January 14, 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg p-8 space-y-8">
          {/* Data Controller */}
          <section className="bg-indigo-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Controller</h2>
            <div className="text-gray-700 space-y-1">
              <p><strong>SPORT INTELLIGENCE TECHNOLOGY S.R.L.</strong></p>
              <p>CUI: 53125536</p>
              <p>Trade Registry: J2025098025007</p>
              <p>EUID: ROONRC.J2025098025007</p>
              <p>Address: Str. Independenței, Nr. 70, Ap. 1, Brașov, County Brașov, Romania</p>
              <p>Email: contact@tournamente.com</p>
            </div>
          </section>

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to tournamente.com, operated by SPORT INTELLIGENCE TECHNOLOGY S.R.L. ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy in accordance with the General Data Protection Regulation (GDPR) and Romanian data protection laws. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our tournament management platform.
            </p>
            <p className="text-gray-700">
              By using tournamente.com, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-3">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Name, email address, and contact information</li>
              <li>Account credentials (username and password)</li>
              <li>Profile information (date of birth, location, profile picture)</li>
              <li>Club and team information</li>
              <li>Tournament registration details</li>
              <li>Payment and billing information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 mb-3">When you access our platform, we automatically collect:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Location data (with your permission)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Information from Third Parties</h3>
            <p className="text-gray-700 mb-3">We may receive information from:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Social media platforms (if you choose to connect your accounts)</li>
              <li>Payment processors for transaction verification</li>
              <li>Analytics providers to understand platform usage</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process tournament registrations and manage competitions</li>
              <li>Send you updates, notifications, and communications</li>
              <li>Process payments and prevent fraud</li>
              <li>Personalize your experience on our platform</li>
              <li>Analyze usage patterns and improve our platform</li>
              <li>Comply with legal obligations</li>
              <li>Protect the security and integrity of our services</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 mb-3">We may share your information with:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Tournament Organizers and Participants</h3>
            <p className="text-gray-700 mb-4">
              When you register for a tournament, relevant information is shared with tournament organizers and other participants as necessary for tournament management.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Service Providers</h3>
            <p className="text-gray-700 mb-4">
              We work with third-party service providers for hosting, payment processing, analytics, and customer support. These providers have access to your information only to perform services on our behalf.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law, court order, or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Business Transfers</h3>
            <p className="text-gray-700">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-3">
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Employee training on data protection</li>
              <li>Regular backups and disaster recovery procedures</li>
            </ul>
            <p className="text-gray-700 mt-4">
              However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-700 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data (subject to legal obligations)</li>
              <li>Object to or restrict processing of your information</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="text-gray-700 mt-4">
              To exercise these rights, please contact us at privacy@tournamente.com
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700">
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we securely delete or anonymize it.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="text-gray-700">
              Our platform is designed for youth sports participants, and we take children's privacy seriously. For users under 16, we require parental consent before collecting personal information. Parents and guardians have the right to review, modify, or delete their child's information.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Supervisory Authority */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Supervisory Authority</h2>
            <p className="text-gray-700 mb-4">
              If you believe that we have not complied with your data protection rights, you have the right to lodge a complaint with the Romanian National Supervisory Authority for Personal Data Processing (ANSPDCP):
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Authority:</strong> Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</p>
              <p className="text-gray-700"><strong>Address:</strong> B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, 010336, București, Romania</p>
              <p className="text-gray-700"><strong>Website:</strong> <a href="https://www.dataprotection.ro" className="text-indigo-600 hover:text-indigo-500 underline" target="_blank" rel="noopener noreferrer">www.dataprotection.ro</a></p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions or concerns about this Privacy Policy or wish to exercise your data protection rights, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Company:</strong> SPORT INTELLIGENCE TECHNOLOGY S.R.L.</p>
              <p className="text-gray-700"><strong>Email:</strong> contact@tournamente.com</p>
              <p className="text-gray-700"><strong>Address:</strong> Str. Independenței, Nr. 70, Ap. 1, Brașov, County Brașov, Romania</p>
              <p className="text-gray-700"><strong>CUI:</strong> 53125536</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
