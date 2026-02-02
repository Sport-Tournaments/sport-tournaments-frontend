'use client';

import { useTranslation } from 'react-i18next';

export default function GDPRPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2563eb] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{t('pages.gdpr.title')}</h1>
          <p className="text-xl text-[#dbeafe]">
            {t('pages.gdpr.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg p-8 space-y-8">
          {/* Data Controller */}
          <section className="bg-[#dbeafe] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.dataController.title')}</h2>
            <div className="text-gray-700 space-y-1">
              <p><strong>SPORT INTELLIGENCE TECHNOLOGY S.R.L.</strong></p>
              <p>CUI: 53125536</p>
              <p>{t('pages.gdpr.dataController.tradeRegistry')}: J2025098025007</p>
              <p>EUID: ROONRC.J2025098025007</p>
              <p>{t('pages.gdpr.dataController.address')}: Str. Independenței, Nr. 70, Ap. 1, Brașov, {t('pages.gdpr.dataController.county')} Brașov, Romania</p>
              <p>Email: contact@tournamente.com</p>
            </div>
          </section>

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
              <p className="text-gray-700"><strong>{t('pages.gdpr.dpo.email')}:</strong> dpo@tournamente.com</p>
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

          {/* Consent Management */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('pages.gdpr.consent.title')}</h2>
            <p className="text-gray-700 mb-4">
              {t('pages.gdpr.consent.description')}
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.consent.essential.title')}</h3>
                <p className="text-gray-700 mb-2">
                  {t('pages.gdpr.consent.essential.description')}
                </p>
                <p className="text-sm text-gray-600 italic">
                  {t('pages.gdpr.consent.essential.examples')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.consent.analytics.title')}</h3>
                <p className="text-gray-700 mb-2">
                  {t('pages.gdpr.consent.analytics.description')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>{t('pages.gdpr.consent.analytics.provider')}:</strong> Google LLC<br />
                  <strong>{t('pages.gdpr.consent.analytics.service')}:</strong> Google Analytics, Google Search Console<br />
                  <strong>{t('pages.gdpr.consent.analytics.purpose')}:</strong> {t('pages.gdpr.consent.analytics.purposeDesc')}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.consent.functional.title')}</h3>
                <p className="text-gray-700">
                  {t('pages.gdpr.consent.functional.description')}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 border border-[#1e3a5f]/20 rounded-lg bg-[#dbeafe]">
              <h4 className="font-semibold text-gray-900 mb-2">{t('pages.gdpr.consent.withdraw.title')}</h4>
              <p className="text-gray-700">
                {t('pages.gdpr.consent.withdraw.description')}
              </p>
            </div>
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
              {t('pages.gdpr.supervisory.link')}: <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="text-[#1e3a5f] hover:text-[#152a45] underline" target="_blank" rel="noopener noreferrer">European Data Protection Board</a>
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
