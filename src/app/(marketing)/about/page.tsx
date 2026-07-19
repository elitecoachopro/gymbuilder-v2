'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

export default function AboutPage() {
  const { t } = useClientTranslations('about');

  return (
    <main className="min-h-screen">

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t('backHome')}
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            {t('title')} <span className="gold-gradient">GymBuilder</span>
          </h1>

          <div className="border-2 border-gold-400 rounded-2xl p-10 md:p-14">
            <p className="text-white leading-relaxed text-base md:text-lg">
              {t('mainParagraph')}
            </p>
          </div>

          <div className="mt-12 space-y-8 text-anthracite-300 leading-relaxed">
            <p>{t('story1')}</p>
            <p>{t('story2')}</p>
            <p>{t('mission')}</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
