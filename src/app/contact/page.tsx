'use client';

import { useTranslation } from 'react-i18next';

const contactMethodKeys = ['email', 'phone', 'address', 'liveChat'];

const methodIcons: Record<string, string> = {
  email: '📧',
  phone: '📞',
  address: '📍',
  liveChat: '💬',
};

const socialLinks = [
  { name: 'Facebook', icon: 'f', url: '#' },
  { name: 'Twitter', icon: '𝕏', url: '#' },
  { name: 'Instagram', icon: '📷', url: '#' },
  { name: 'LinkedIn', icon: 'in', url: '#' },
];

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t('pages.contact.title')}</h1>
          <p className="text-xl text-indigo-100">
            {t('pages.contact.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Contact Form */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {t('pages.contact.sendMessage')}
          </h2>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.contact.fullName')}
              </label>
              <input
                type="text"
                placeholder={t('pages.contact.fullName')}
                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.contact.email')}
              </label>
              <input
                type="email"
                placeholder={t('pages.contact.email')}
                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.contact.subject')}
              </label>
              <input
                type="text"
                placeholder={t('pages.contact.subject')}
                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.contact.message')}
              </label>
              <textarea
                rows={5}
                placeholder={t('pages.contact.message')}
                className="w-full px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors font-semibold"
            >
              {t('pages.contact.sendButton')}
            </button>
          </form>
        </div>

        {/* Response Time Info */}
        <div className="bg-indigo-50 /20 rounded-lg p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900  mb-2">
            {t('pages.contact.responseTime')}
          </h3>
          <p className="text-gray-600 ">
            {t('pages.contact.responseTimeDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
