'use client';

import { useTranslation } from 'react-i18next';

export default function GDPRPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t('pages.gdpr.title')}</h1>
          <p className="text-xl text-indigo-100">
            {t('pages.gdpr.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.commitment.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('pages.gdpr.commitment.description1')}
            </p>
            <p className="text-gray-700">
              {t('pages.gdpr.commitment.description2')}
            </p>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.legalBasis.title')}</h2>
            <p className="text-gray-700 mb-3">{t('pages.gdpr.legalBasis.description')}</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.legalBasis.consent.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.legalBasis.consent.description')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.legalBasis.contract.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.legalBasis.contract.description')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.legalBasis.legalObligation.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.legalBasis.legalObligation.description')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.legalBasis.legitimateInterests.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.legalBasis.legitimateInterests.description')}
                </p>
              </div>
            </div>
          </section>

          {/* Your GDPR Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.rights.title')}</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.gdpr.rights.access.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.rights.access.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.gdpr.rights.rectification.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.rights.rectification.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.gdpr.rights.erasure.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.rights.erasure.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.gdpr.rights.restrict.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.rights.restrict.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.gdpr.rights.portability.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.rights.portability.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.gdpr.rights.object.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.rights.object.description')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('pages.gdpr.rights.automated.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.rights.automated.description')}
                </p>
              </div>
            </div>
          </section>

          {/* Data Protection Officer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.dpo.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('pages.gdpr.dpo.description')}
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>{t('pages.gdpr.dpo.email')}:</strong> dpo@worldwidefootball.com</p>
              <p className="text-gray-700"><strong>{t('pages.gdpr.dpo.subject')}:</strong> {t('pages.gdpr.dpo.subjectLine')}</p>
            </div>
          </section>

          {/* Data Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.dataTransfers.title')}</h2>
            <p className="text-gray-700 mb-3">
              {t('pages.gdpr.dataTransfers.description')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>{t('pages.gdpr.dataTransfers.safeguard1')}</li>
              <li>{t('pages.gdpr.dataTransfers.safeguard2')}</li>
              <li>{t('pages.gdpr.dataTransfers.safeguard3')}</li>
              <li>{t('pages.gdpr.dataTransfers.safeguard4')}</li>
            </ul>
          </section>

          {/* Data Breach Notification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.dataBreach.title')}</h2>
            <p className="text-gray-700">
              {t('pages.gdpr.dataBreach.description')}
            </p>
          </section>

          {/* Exercising Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.exercise.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('pages.gdpr.exercise.description')}
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 mb-4">
              <li>{t('pages.gdpr.exercise.step1')}</li>
              <li>{t('pages.gdpr.exercise.step2')}</li>
              <li>{t('pages.gdpr.exercise.step3')}</li>
              <li>{t('pages.gdpr.exercise.step4')}</li>
            </ol>
            <p className="text-gray-700">
              {t('pages.gdpr.exercise.complaint')}
            </p>
          </section>

          {/* Supervisory Authority */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.supervisory.title')}</h2>
            <p className="text-gray-700 mb-3">
              {t('pages.gdpr.supervisory.description')}
            </p>
            <p className="text-gray-700">
              {t('pages.gdpr.supervisory.link')}: <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="text-indigo-600 hover:text-indigo-500 underline" target="_blank" rel="noopener noreferrer">European Data Protection Board</a>
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.updates.title')}</h2>
            <p className="text-gray-700">
              {t('pages.gdpr.updates.description')}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
