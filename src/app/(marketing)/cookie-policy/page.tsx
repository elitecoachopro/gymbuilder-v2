'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

export default function CookiePolicyPage() {
  const { t } = useClientTranslations('cookiePolicy');

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t('backHome')}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('title')}</h1>
          <p className="text-anthracite-400 text-sm mb-10">{t('lastUpdated')}</p>

          <div className="prose-custom space-y-8 text-anthracite-300 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s1Title')}</h2>
              <p>{t('s1Text')}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s2Title')}</h2>
              
              <h3 className="text-lg font-medium text-white mt-6 mb-2">{t('s2_1Title')}</h3>
              <p className="mb-3" dangerouslySetInnerHTML={{ __html: t('s2_1Text') }} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-anthracite-700 rounded-lg overflow-hidden">
                  <thead className="bg-anthracite-800">
                    <tr>
                      <th className="text-left px-4 py-2 text-white font-medium">Cookie</th>
                      <th className="text-left px-4 py-2 text-white font-medium">{t('tableScope')}</th>
                      <th className="text-left px-4 py-2 text-white font-medium">{t('tableDuration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-anthracite-700">
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-gold-400">session_token</td>
                      <td className="px-4 py-2">{t('cookieSession')}</td>
                      <td className="px-4 py-2">{t('cookie7days')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs text-gold-400">gymbuilder_cookie_consent</td>
                      <td className="px-4 py-2">{t('cookieConsent')}</td>
                      <td className="px-4 py-2">{t('cookiePersistent')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium text-white mt-6 mb-2">{t('s2_2Title')}</h3>
              <p className="mb-3" dangerouslySetInnerHTML={{ __html: t('s2_2Text') }} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-anthracite-700 rounded-lg overflow-hidden">
                  <thead className="bg-anthracite-800">
                    <tr>
                      <th className="text-left px-4 py-2 text-white font-medium">{t('tableProvider')}</th>
                      <th className="text-left px-4 py-2 text-white font-medium">{t('tableScope')}</th>
                      <th className="text-left px-4 py-2 text-white font-medium">{t('tableDuration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-anthracite-700">
                    <tr>
                      <td className="px-4 py-2">Vercel Analytics</td>
                      <td className="px-4 py-2">{t('analyticsScope')}</td>
                      <td className="px-4 py-2">{t('analyticsSession')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium text-white mt-6 mb-2">{t('s2_3Title')}</h3>
              <p className="mb-3" dangerouslySetInnerHTML={{ __html: t('s2_3Text') }} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s3Title')}</h2>
              <p className="mb-3">{t('s3Intro')}</p>
              <ul className="list-disc list-inside space-y-2 ml-2" dangerouslySetInnerHTML={{ __html: t('s3List') }} />
              <p className="mt-3 text-sm text-anthracite-400">{t('s3Note')}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s4Title')}</h2>
              <p>{t('s4Text')}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s5Title')}</h2>
              <p>{t('s5Text')}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s6Title')}</h2>
              <p className="mb-3">{t('s6Intro')}</p>
              <ul className="list-disc list-inside space-y-2 ml-2" dangerouslySetInnerHTML={{ __html: t('s6List') }} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s7Title')}</h2>
              <p>{t('s7Text')}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s8Title')}</h2>
              <p>{t('s8Text')}</p>
              <ul className="list-none space-y-1 mt-3">
                <li><strong className="text-white">Email:</strong> contact@gymbuilder.app</li>
                <li><strong className="text-white">{t('address')}:</strong> Mangalia, România</li>
              </ul>
            </div>
          </div>

          {/* Related links */}
          <div className="mt-12 pt-8 border-t border-anthracite-800">
            <p className="text-anthracite-400 text-sm mb-4">{t('relatedPages')}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                {t('privacyLink')}
              </Link>
              <Link href="/terms" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                {t('termsLink')}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
