import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Center - Worldwide Football',
  description: 'Get help with Worldwide Football. Find answers to common questions and troubleshooting guides.',
};

const helpCategories = [
  {
    title: 'Getting Started',
    icon: '🚀',
    articles: [
      { title: 'How to sign up', slug: '#' },
      { title: 'Creating your profile', slug: '#' },
      { title: 'Verifying your email', slug: '#' },
      { title: 'First steps as a tournament organizer', slug: '#' },
    ],
  },
  {
    title: 'Tournaments',
    icon: '⚽',
    articles: [
      { title: 'How to create a tournament', slug: '#' },
      { title: 'Setting tournament dates and venues', slug: '#' },
      { title: 'Managing teams and participants', slug: '#' },
      { title: 'Tournament settings and rules', slug: '#' },
      { title: 'Publishing your tournament', slug: '#' },
    ],
  },
  {
    title: 'Teams & Clubs',
    icon: '👥',
    articles: [
      { title: 'How to create a club', slug: '#' },
      { title: 'Adding team members', slug: '#' },
      { title: 'Managing club details', slug: '#' },
      { title: 'Registering teams for tournaments', slug: '#' },
      { title: 'Updating team rosters', slug: '#' },
    ],
  },
  {
    title: 'Matches & Schedules',
    icon: '📅',
    articles: [
      { title: 'How to create match schedules', slug: '#' },
      { title: 'Setting match details', slug: '#' },
      { title: 'Updating match results', slug: '#' },
      { title: 'Generating group stages', slug: '#' },
      { title: 'Managing knockouts', slug: '#' },
    ],
  },
  {
    title: 'Standings & Statistics',
    icon: '📊',
    articles: [
      { title: 'Understanding tournament standings', slug: '#' },
      { title: 'Viewing team statistics', slug: '#' },
      { title: 'Top scorers and player stats', slug: '#' },
      { title: 'Exporting reports', slug: '#' },
    ],
  },
  {
    title: 'Communication & Notifications',
    icon: '📧',
    articles: [
      { title: 'Sending messages to teams', slug: '#' },
      { title: 'Notification settings', slug: '#' },
      { title: 'Email preferences', slug: '#' },
      { title: 'Announcements and updates', slug: '#' },
    ],
  },
];

const faqs = [
  {
    question: 'How much does it cost to use Worldwide Football?',
    answer: 'We offer a free Basic plan with limited features, as well as Professional and Enterprise plans with unlimited tournaments and advanced features. Visit our Pricing page for more details.',
  },
  {
    question: 'Can I create multiple tournaments?',
    answer: 'Yes! With Professional and Enterprise plans, you can create unlimited tournaments. The Basic plan allows up to 1 tournament.',
  },
  {
    question: 'How do I export tournament data?',
    answer: 'You can export standings, match results, and team information from your tournament dashboard. Professional and Enterprise plans have additional export options.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption and security practices to protect your data. All data is backed up regularly.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. No long-term contracts required.',
  },
  {
    question: 'Do you offer API access?',
    answer: 'API access is available with our Enterprise plan. Contact our sales team to learn more about integration options.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Help Center</h1>
          <p className="text-xl text-indigo-100">
            Find answers and get support
          </p>
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search help articles..."
              className="w-full max-w-md px-4 py-3 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {helpCategories.map((category, index) => (
            <div
              key={index}
              className="bg-white  rounded-lg p-6 border border-gray-200  hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h2 className="text-xl font-bold text-gray-900  mb-4">
                {category.title}
              </h2>
              <ul className="space-y-2">
                {category.articles.map((article, aIndex) => (
                  <li key={aIndex}>
                    <Link
                      href={article.slug}
                      className="text-indigo-600  hover:underline"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900  mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="bg-white  rounded-lg divide-y divide-gray-200 ">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="p-6 cursor-pointer group"
              >
                <summary className="flex items-center justify-between font-semibold text-gray-900  hover:text-indigo-600 ">
                  <span>{faq.question}</span>
                  <span className="ml-4 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 ">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-indigo-50 /20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900  mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600  mb-6">
            Can't find what you're looking for? Contact our support team.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors font-semibold"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
