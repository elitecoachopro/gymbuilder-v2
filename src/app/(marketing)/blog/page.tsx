'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Bell } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

export default function BlogPage() {
  const { t } = useClientTranslations('blog');

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t('backHome')}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{t('title')}</h1>
          <p className="text-anthracite-400 mb-12 max-w-2xl">
            {t('subtitle')}
          </p>

          {/* Coming soon state */}
          <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-10 md:p-16 text-center">
            <div className="w-16 h-16 bg-gold-400/10 border border-gold-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-gold-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">{t('comingSoon')}</h2>
            <p className="text-anthracite-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
              {t('comingSoonDesc')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/#newsletter"
                className="inline-flex items-center gap-2 bg-gold-400 text-anthracite-950 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {t('subscribe')}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-anthracite-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:border-gold-400 hover:text-gold-400 transition-colors"
              >
                {t('suggestTopic')}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
