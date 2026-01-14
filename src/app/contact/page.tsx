import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Worldwide Football',
  description: 'Get in touch with the Worldwide Football team. We\'d love to hear from you.',
};

const contactMethods = [
  {
    icon: '📧',
    title: 'Email',
    value: 'support@worldwidefootball.com',
    description: 'For general inquiries and support',
  },
  {
    icon: '📞',
    title: 'Phone',
    value: '+1 (555) 123-4567',
    description: 'Call us Monday to Friday, 9AM-6PM EST',
  },
  {
    icon: '📍',
    title: 'Address',
    value: '123 Football Street, New York, NY 10001',
    description: 'Visit us at our headquarters',
  },
  {
    icon: '💬',
    title: 'Live Chat',
    value: 'Chat with us',
    description: 'Available during business hours',
  },
];

const socialLinks = [
  { name: 'Facebook', icon: 'f', url: '#' },
  { name: 'Twitter', icon: '𝕏', url: '#' },
  { name: 'Instagram', icon: '📷', url: '#' },
  { name: 'LinkedIn', icon: 'in', url: '#' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-indigo-100">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Contact Form */}
          <div className="bg-white  rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900  mb-6">
              Send us a message
            </h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-2 rounded-md border border-gray-300  bg-white  text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 rounded-md border border-gray-300  bg-white  text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  className="w-full px-4 py-2 rounded-md border border-gray-300  bg-white  text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700  mb-2">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Tell us more..."
                  className="w-full px-4 py-2 rounded-md border border-gray-300  bg-white  text-gray-900  focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors font-semibold"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900  mb-6">
              Get in touch
            </h2>
            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 bg-white  rounded-lg border border-gray-200 "
                >
                  <div className="text-3xl flex-shrink-0">{method.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 ">
                      {method.title}
                    </h3>
                    <p className="text-indigo-600  font-medium">
                      {method.value}
                    </p>
                    <p className="text-sm text-gray-600 ">
                      {method.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900  mb-4">
                Follow us
              </h3>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors"
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Response Time Info */}
        <div className="bg-indigo-50 /20 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900  mb-2">
            We'll get back to you quickly
          </h3>
          <p className="text-gray-600 ">
            Our team typically responds to inquiries within 24 hours during business days.
          </p>
        </div>
      </div>
    </div>
  );
}
