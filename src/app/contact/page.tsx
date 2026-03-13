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
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-[var(--uefa-blue)] to-[var(--uefa-blue-light)] px-4 py-12 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t('pages.contact.title')}</h1>
          <p className="text-xl text-white/80">
            {t('pages.contact.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Contact Form */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
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
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--uefa-blue-light)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.contact.email')}
              </label>
              <input
                type="email"
                placeholder={t('pages.contact.email')}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--uefa-blue-light)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.contact.subject')}
              </label>
              <input
                type="text"
                placeholder={t('pages.contact.subject')}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--uefa-blue-light)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pages.contact.message')}
              </label>
              <textarea
                rows={5}
                placeholder={t('pages.contact.message')}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--uefa-blue-light)]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-[var(--uefa-blue-light)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--uefa-blue-hover)]"
            >
              {t('pages.contact.sendButton')}
            </button>
          </form>
        </div>

        {/* Response Time Info */}
        <div className="rounded-lg bg-[#dbeafe] p-8 text-center">
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
