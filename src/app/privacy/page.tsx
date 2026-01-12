import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Worldwide Football',
  description: 'Privacy policy for the Worldwide Football platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <div className="inline-block px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-6">
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Coming Soon</p>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            We take your privacy seriously. Our privacy policy is being prepared to explain 
            how we collect, use, and protect your personal information.
          </p>
        </div>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
