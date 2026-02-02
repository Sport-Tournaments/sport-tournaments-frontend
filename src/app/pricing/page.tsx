import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing - tournamente.com',
  description: 'View our pricing plans for tournament management and participation.',
};

const plans = [
  {
    name: 'Basic',
    price: 'Free',
    description: 'Perfect for small tournaments and clubs',
    features: [
      'Up to 1 tournament',
      'Up to 10 teams',
      'Basic match scheduling',
      'Basic standings',
      'Email support',
      'Community access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$29',
    period: '/month',
    description: 'Ideal for growing tournament organizers',
    features: [
      'Unlimited tournaments',
      'Up to 100 teams per tournament',
      'Advanced scheduling',
      'Custom standings',
      'Team communication tools',
      'Priority email support',
      'Custom branding',
      'Analytics dashboard',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations and federations',
    features: [
      'Everything in Professional',
      'Unlimited teams',
      'API access',
      '24/7 phone support',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced analytics',
      'White-label options',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-[#dbeafe]">
            Choose the perfect plan for your needs
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg overflow-hidden transition-transform hover:scale-105 ${
                plan.highlighted
                  ? 'ring-2 ring-[#1e3a5f] shadow-2xl'
                  : 'border border-gray-200'
              } bg-white`}
            >
              {plan.highlighted && (
                <div className="bg-[#1e3a5f] text-white text-center py-2 font-semibold">
                  Most Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 ml-2">
                      {plan.period}
                    </span>
                  )}
                </div>
                <button
                  className={`w-full py-3 rounded-md font-semibold transition-colors mb-8 ${
                    plan.highlighted
                      ? 'bg-[#1e3a5f] text-white hover:bg-[#152a45]'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
                <div className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer discounts for annual billing?
              </h3>
              <p className="text-gray-600">
                Yes, annual plans include 20% discount compared to monthly billing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What about payment methods?
              </h3>
              <p className="text-gray-600">
                We accept credit cards, bank transfers, and PayPal for your convenience.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes, Professional and Enterprise plans come with a 14-day free trial.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#dbeafe] rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Start?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of tournament organizers managing their competitions on tournamente.com.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-3 bg-[#1e3a5f] text-white rounded-md hover:bg-[#152a45] transition-colors font-semibold"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}
