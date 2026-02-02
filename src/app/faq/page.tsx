import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - tournamente.com',
  description: 'Frequently asked questions about the tournamente.com platform.',
};

const faqCategories = [
  {
    title: 'Getting Started',
    faqs: [
      {
        question: 'What is tournamente.com?',
        answer: 'tournamente.com is a comprehensive platform for managing tournaments, clubs, and teams. It allows organizers to schedule matches, manage registrations, track standings, and communicate with participants.',
      },
      {
        question: 'Do I need to create an account?',
        answer: 'Yes, you need to create an account to use the platform. Registration is free and takes just a few minutes. You can sign up as a tournament organizer, club manager, or team participant.',
      },
      {
        question: 'How do I sign up?',
        answer: 'Click the "Sign Up" button on the homepage, provide your email address, create a password, and fill in your profile information. You can start using the platform immediately after registration.',
      },
      {
        question: 'Is there a mobile app?',
        answer: 'Our platform is fully responsive and works great on mobile devices. We\'re also developing native iOS and Android apps that will be available soon.',
      },
    ],
  },
  {
    title: 'Tournaments',
    faqs: [
      {
        question: 'How do I create a tournament?',
        answer: 'Log in to your account, navigate to "Create Tournament", fill in the tournament details (name, date, location, format), and click "Create". You can then add categories, teams, and schedule matches.',
      },
      {
        question: 'What tournament formats are supported?',
        answer: 'We support multiple formats including group stage, knockout, round-robin, and hybrid formats. You can customize the format based on your needs.',
      },
      {
        question: 'Can I edit a tournament after creating it?',
        answer: 'Yes, you can edit most tournament details. However, some settings may be locked once matches have started to maintain data integrity.',
      },
      {
        question: 'How do I publish my tournament?',
        answer: 'After creating your tournament, you can publish it to make it visible to other users. They can then register their teams to participate.',
      },
      {
        question: 'Can I duplicate a tournament?',
        answer: 'Yes, you can duplicate an existing tournament to quickly create similar ones. The new tournament will have the same structure but separate data.',
      },
    ],
  },
  {
    title: 'Clubs & Teams',
    faqs: [
      {
        question: 'How do I create a club?',
        answer: 'Go to your dashboard, click "Create Club", enter the club name, add basic information, and save. You can then add teams and members to your club.',
      },
      {
        question: 'How many teams can a club have?',
        answer: 'The number of teams depends on your subscription plan. Basic plans allow unlimited teams, while Professional and Enterprise plans have additional features.',
      },
      {
        question: 'How do I add members to my club?',
        answer: 'In your club dashboard, go to Members, click "Add Member", and provide their email address. They\'ll receive an invitation to join your club.',
      },
      {
        question: 'Can I manage team rosters?',
        answer: 'Yes, you can add and remove players from your team roster. You can also assign positions, jersey numbers, and track player statistics.',
      },
    ],
  },
  {
    title: 'Matches & Schedules',
    faqs: [
      {
        question: 'How do I create match schedules?',
        answer: 'In your tournament dashboard, go to "Schedule", select the teams and date/time, and create matches. You can create them individually or use our scheduling algorithm.',
      },
      {
        question: 'Can I automatically generate group stage matches?',
        answer: 'Yes, our scheduling tool can automatically generate group stage matches, round-robin schedules, and knockout brackets based on your settings.',
      },
      {
        question: 'How do I update match results?',
        answer: 'After a match is played, open the match details and enter the final score. You can also add details like goal scorers and red/yellow cards.',
      },
      {
        question: 'Can participants see the schedule?',
        answer: 'Yes, published schedules are visible to all tournament participants. You can set specific visibility preferences for each match.',
      },
    ],
  },
  {
    title: 'Standings & Statistics',
    faqs: [
      {
        question: 'How are standings calculated?',
        answer: 'Standings are automatically calculated based on match results. Typically, 3 points for a win, 1 point for a draw, and 0 for a loss. You can customize point systems.',
      },
      {
        question: 'How do I view team statistics?',
        answer: 'Go to the tournament dashboard and select "Standings". You\'ll see points, wins, losses, draws, goals for/against, and other statistics.',
      },
      {
        question: 'Can I export tournament data?',
        answer: 'Yes, you can export standings, match results, and team information as CSV or PDF. This feature is available in Professional and Enterprise plans.',
      },
      {
        question: 'Where can I find top scorers?',
        answer: 'Go to the tournament statistics page and select "Top Scorers" to see the highest-scoring players ranked by number of goals.',
      },
    ],
  },
  {
    title: 'Account & Billing',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept credit cards (Visa, Mastercard, Amex), bank transfers, and PayPal.',
      },
      {
        question: 'Can I cancel my subscription?',
        answer: 'Yes, you can cancel anytime from your account settings. No long-term contracts are required.',
      },
      {
        question: 'Is there a free trial?',
        answer: 'Yes, Professional and Enterprise plans offer a 14-day free trial with full access to all features.',
      },
      {
        question: 'Can I change my plan?',
        answer: 'Yes, you can upgrade or downgrade your plan anytime. Changes take effect immediately and billing is adjusted accordingly.',
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your inbox.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-[#dbeafe]">
            Find answers to common questions about tournamente.com
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-2xl font-bold text-gray-900  mb-6">
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.faqs.map((faq, faqIndex) => (
                  <details
                    key={faqIndex}
                    className="bg-white  rounded-lg overflow-hidden group"
                  >
                    <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50  transition-colors">
                      <h3 className="font-semibold text-gray-900  text-lg">
                        {faq.question}
                      </h3>
                      <span className="ml-4 group-open:rotate-180 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-[#1e3a5f] "
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-6 pb-6 border-t border-gray-200 ">
                      <p className="text-gray-600  leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 bg-[#dbeafe] /20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900  mb-4">
            Still have questions?
          </h2>
          <p className="text-gray-600  mb-6">
            Can't find what you're looking for? Contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-[#1e3a5f] text-white rounded-md hover:bg-[#152a45] transition-colors font-semibold"
            >
              Contact Support
            </Link>
            <Link
              href="/help"
              className="px-8 py-3 border-2 border-[#1e3a5f] text-[#1e3a5f]   rounded-md hover:bg-[#dbeafe] /20 transition-colors font-semibold"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
