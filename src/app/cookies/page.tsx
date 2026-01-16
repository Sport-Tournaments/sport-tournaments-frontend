import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - tournamente.com',
  description: 'Learn about how tournamente.com uses cookies and similar tracking technologies.',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-xl text-indigo-100">
            Last updated: January 14, 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
            </p>
            <p className="text-gray-700">
              This Cookie Policy explains what cookies are, how we use them, and how you can control them.
            </p>
          </section>

          {/* Types of Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1 Strictly Necessary Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies are essential for our website to function properly. They enable core functionality such as security, network management, and accessibility.
                </p>
                <p className="text-sm text-gray-600 italic">
                  Examples: Authentication cookies, session cookies, security cookies
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.2 Performance Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies collect information about how you use our website, such as which pages you visit most often and if you receive error messages. This helps us improve the performance of our platform.
                </p>
                <p className="text-sm text-gray-600 italic">
                  Examples: Google Analytics, page load time tracking
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.3 Functionality Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies allow our website to remember choices you make (such as your language preference) and provide enhanced, more personalized features.
                </p>
                <p className="text-sm text-gray-600 italic">
                  Examples: Language preference, region selection, user interface customization
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.4 Targeting/Advertising Cookies</h3>
                <p className="text-gray-700 mb-2">
                  These cookies are used to deliver advertisements more relevant to you and your interests. They may also be used to limit the number of times you see an advertisement and measure the effectiveness of advertising campaigns.
                </p>
                <p className="text-sm text-gray-600 italic">
                  Examples: Social media cookies, retargeting cookies
                </p>
              </div>
            </div>
          </section>

          {/* Specific Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Specific Cookies We Use</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cookie Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">session_token</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Maintains your login session</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Session</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">auth_token</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Authenticates your account</td>
                    <td className="px-4 py-3 text-sm text-gray-700">30 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">language_pref</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Remembers your language choice</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 year</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">_ga</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Google Analytics tracking</td>
                    <td className="px-4 py-3 text-sm text-gray-700">2 years</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">cookie_consent</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Stores your cookie preferences</td>
                    <td className="px-4 py-3 text-sm text-gray-700">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-3">
              We use services from third parties that may also set cookies on your device:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Google Analytics:</strong> Helps us understand how users interact with our website</li>
              <li><strong>Payment Processors:</strong> Secure payment processing for tournament registrations</li>
              <li><strong>Social Media Platforms:</strong> Enable social sharing and login features</li>
              <li><strong>Content Delivery Networks (CDNs):</strong> Improve website performance and speed</li>
            </ul>
          </section>

          {/* Managing Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How to Manage Cookies</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Browser Settings</h3>
            <p className="text-gray-700 mb-3">
              You can control and/or delete cookies through your browser settings. Here's how to manage cookies in popular browsers:
            </p>
            
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
              <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Opt-Out Tools</h3>
            <p className="text-gray-700 mb-3">You can opt out of specific tracking technologies:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-indigo-600 hover:text-indigo-500 underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a></li>
              <li><strong>Advertising Cookies:</strong> <a href="http://www.youronlinechoices.com/" className="text-indigo-600 hover:text-indigo-500 underline" target="_blank" rel="noopener noreferrer">Your Online Choices</a></li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Disabling certain cookies may affect the functionality of our website and your user experience.
              </p>
            </div>
          </section>

          {/* Do Not Track */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Do Not Track Signals</h2>
            <p className="text-gray-700">
              Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that you do not want to have your online activity tracked. We currently do not respond to DNT signals, as there is no industry standard for how to respond to these signals.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to This Cookie Policy</h2>
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any significant changes by posting a notice on our website.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> privacy@tournamente.com</p>
              <p className="text-gray-700"><strong>Subject Line:</strong> Cookie Policy Inquiry</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
