import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works - tournamente.com',
  description: 'Learn how our platform works for tournament organizers and participants.',
};

const steps = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up as a tournament organizer or club member in just a few minutes. Choose your role and complete your profile.',
    icon: '👤',
  },
  {
    number: 2,
    title: 'Create a Tournament',
    description: 'Set up your tournament with details like dates, location, age categories, and rules. Define your competition format.',
    icon: '⚽',
  },
  {
    number: 3,
    title: 'Add Age Categories',
    description: 'Organize teams into age groups with customized settings, game formats, and participation fees for each category.',
    icon: '👥',
  },
  {
    number: 4,
    title: 'Teams Register',
    description: 'Teams browse your tournament and submit registration requests. Review and approve registrations from your dashboard.',
    icon: '✅',
  },
  {
    number: 5,
    title: 'Create Groups & Matches',
    description: 'Organize teams into groups and generate match schedules. Manage the competition format and brackets.',
    icon: '📅',
  },
  {
    number: 6,
    title: 'Track Results',
    description: 'Update match results, manage standings, and keep participants informed throughout the tournament.',
    icon: '📊',
  },
];

const features = [
  {
    title: 'Easy Registration',
    description: 'Streamlined registration process for teams with automatic confirmation and payment handling.',
  },
  {
    title: 'Match Management',
    description: 'Manage matches, update scores, and generate automatic standings and leaderboards.',
  },
  {
    title: 'Team Communication',
    description: 'Built-in messaging system to communicate with teams and participants throughout the tournament.',
  },
  {
    title: 'Analytics & Reports',
    description: 'Comprehensive statistics and reports to track tournament performance and team progress.',
  },
  {
    title: 'Mobile Friendly',
    description: 'Access your tournaments and information on any device with our responsive design.',
  },
  {
    title: 'Secure Payments',
    description: 'Safe and secure payment processing for registration fees and participation charges.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h1>
          <p className="text-xl text-indigo-100">
            Follow these simple steps to organize and manage your football tournaments
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Steps Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            6 Easy Steps to Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="bg-gray-50 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-indigo-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of tournament organizers using tournamente.com to manage their competitions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors font-semibold"
            >
              Sign Up Now
            </Link>
            <Link
              href="/main/tournaments"
              className="px-8 py-3 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors font-semibold"
            >
              Browse Tournaments
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
