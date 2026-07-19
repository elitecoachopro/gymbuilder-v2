'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

export default function ReturnPolicyPage() {
  const { t } = useClientTranslations('returnPolicy');

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t('backHome')}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('title')}</h1>
          <p className="text-anthracite-400 text-sm mb-10">{t('lastUpdated')}</p>

          <div className="space-y-8 text-anthracite-300 leading-relaxed">
            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s1Title')}</h2>
              <p>{t('s1Intro')}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2" dangerouslySetInnerHTML={{ __html: t('s1List') }} />
              <p className="mt-3">{t('s1Note')}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s2Title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('s2Text') }} />
              <div className="mt-4 bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-5">
                <p className="text-white font-medium mb-2">{t('s2BoxTitle')}</p>
                <ul className="list-disc list-inside space-y-1 text-sm" dangerouslySetInnerHTML={{ __html: t('s2BoxList') }} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s3Title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('s3Intro') }} />
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2" dangerouslySetInnerHTML={{ __html: t('s3List') }} />
              <div className="mt-4 bg-gold-400/5 border border-gold-400/20 rounded-xl p-5">
                <p className="text-gold-400 text-sm font-medium">{t('s3Important')}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s4Title')}</h2>
              <p className="mb-3">{t('s4Intro')}</p>
              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-5 space-y-3">
                <p className="text-white font-medium">{t('s4StepsTitle')}</p>
                <ol className="list-decimal list-inside space-y-2 text-sm" dangerouslySetInnerHTML={{ __html: t('s4Steps') }} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s5Title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('s5Text') }} />
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2" dangerouslySetInnerHTML={{ __html: t('s5List') }} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s6Title')}</h2>
              <p>{t('s6Intro')}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2" dangerouslySetInnerHTML={{ __html: t('s6List') }} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s7Title')}</h2>
              <p className="mb-3">{t('s7Intro')}</p>
              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-5 text-sm space-y-2">
                <p className="italic text-anthracite-300">{t('s7Form1')}</p>
                <p className="italic text-anthracite-300">{t('s7Form2')}</p>
                <p className="italic text-anthracite-300">{t('s7Form3')}</p>
                <p className="italic text-anthracite-300">{t('s7Form4')}</p>
                <p className="italic text-anthracite-300">{t('s7Form5')}</p>
                <p className="italic text-anthracite-300">{t('s7Form6')}</p>
                <p className="italic text-anthracite-300">{t('s7Form7')}</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s8Title')}</h2>
              <p>{t('s8Intro')}</p>
              <p className="mt-3">{t('s8Alt')}</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-2">
                <li>
                  <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 underline underline-offset-2">
                    ANPC
                  </a>
                </li>
                <li>
                  <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 underline underline-offset-2">
                    {t('s8Sol')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mt-8 mb-3">{t('s9Title')}</h2>
              <p>{t('s9Intro')}</p>
              <ul className="list-none space-y-1 mt-3">
                <li><strong className="text-white">Email:</strong> contact@gymbuilder.app</li>
                <li><strong className="text-white">{t('phoneLabel')}:</strong> 0743 891 218 ({t('phoneHours')})</li>
                <li><strong className="text-white">{t('responseTime')}:</strong> {t('responseValue')}</li>
              </ul>
            </div>
          </div>

          {/* Related links */}
          <div className="mt-12 pt-8 border-t border-anthracite-800">
            <p className="text-anthracite-400 text-sm mb-4">{t('relatedPages')}</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                {t('termsLink')}
              </Link>
              <Link href="/privacy" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                {t('privacyLink')}
              </Link>
              <Link href="/cookie-policy" className="text-gold-400 hover:text-gold-300 text-sm underline underline-offset-2 transition-colors">
                {t('cookieLink')}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
