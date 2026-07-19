'use client';

import Footer from '@/components/layout/Footer';
import { useClientTranslations } from '@/i18n/client';

export default function TermsPage() {
  const { t } = useClientTranslations('terms');

  return (
    <main className="min-h-screen">

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">
            {t('titlePart1')} <span className="gold-gradient">{t('titlePart2')}</span>
          </h1>

          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-anthracite-300">
            <p className="text-anthracite-400 text-sm">{t('lastUpdated')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s1Title')}</h2>
            <p>{t('s1Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s2Title')}</h2>
            <p>{t('s2Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s3Title')}</h2>
            <p>{t('s3Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s4Title')}</h2>
            <p>{t('s4Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s5Title')}</h2>
            <p>{t('s5Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s6Title')}</h2>
            <p>{t('s6Text')}</p>

            <h2 className="text-xl font-semibold text-white mt-8">{t('s7Title')}</h2>
            <p>
              {t('s7Text')}{' '}
              <a href="mailto:contact@gymbuilder.app" className="text-gold-400 hover:text-gold-300"> contact@gymbuilder.app</a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
