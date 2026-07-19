'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { ArrowLeft, Search, MessageSquare, CheckCircle, UserPlus, ShieldCheck, Package, Bell, Building2, ClipboardList, Ruler, ShoppingCart } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

function StepCard({ number, title, description, icon: Icon }: { number: number; title: string; description: string; icon: React.ElementType }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0">
        <div className="w-10 h-10 bg-gold-400/10 border border-gold-400/30 rounded-xl flex items-center justify-center">
          <span className="text-gold-400 font-bold text-sm">{number}</span>
        </div>
      </div>
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-gold-400" />
          <h4 className="text-white font-semibold text-sm">{title}</h4>
        </div>
        <p className="text-anthracite-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function CumFunctioneazaPage() {
  const { t } = useClientTranslations('howItWorks');

  const clientIcons = [Search, ClipboardList, MessageSquare, CheckCircle];
  const supplierIcons = [UserPlus, ShieldCheck, Package, Bell];
  const buildIcons = [Ruler, ClipboardList, ShoppingCart, MessageSquare];

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t('backHome')}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{t('title')}</h1>
          <p className="text-anthracite-400 mb-14 max-w-2xl">
            {t('subtitle')}
          </p>

          {/* Section 1: Client */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('clients.title')}</h2>
                <p className="text-anthracite-400 text-xs">{t('clients.subtitle')}</p>
              </div>
            </div>
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-6">
              {Array.from({ length: 4 }, (_, i) => (
                <StepCard
                  key={i}
                  number={i + 1}
                  icon={clientIcons[i]}
                  title={t(`clients.steps.${i}.title`)}
                  description={t(`clients.steps.${i}.description`)}
                />
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/register/client" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                {t('clients.cta')}
              </Link>
            </div>
          </div>

          {/* Section 2: Supplier */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('suppliers.title')}</h2>
                <p className="text-anthracite-400 text-xs">{t('suppliers.subtitle')}</p>
              </div>
            </div>
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-6">
              {Array.from({ length: 4 }, (_, i) => (
                <StepCard
                  key={i}
                  number={i + 1}
                  icon={supplierIcons[i]}
                  title={t(`suppliers.steps.${i}.title`)}
                  description={t(`suppliers.steps.${i}.description`)}
                />
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/register/supplier" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                {t('suppliers.cta')}
              </Link>
            </div>
          </div>

          {/* Section 3: Build from scratch */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 bg-gold-400/10 border border-gold-400/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('build.title')}</h2>
                <p className="text-anthracite-400 text-xs">{t('build.subtitle')}</p>
              </div>
            </div>
            <div className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8 space-y-6">
              {Array.from({ length: 4 }, (_, i) => (
                <StepCard
                  key={i}
                  number={i + 1}
                  icon={buildIcons[i]}
                  title={t(`build.steps.${i}.title`)}
                  description={t(`build.steps.${i}.description`)}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-6">
              <Link href="/construieste-sala" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                {t('build.cta1')}
              </Link>
              <Link href="/consultation" className="text-gold-400 hover:text-gold-300 text-sm font-medium underline underline-offset-2 transition-colors">
                {t('build.cta2')}
              </Link>
            </div>
          </div>

          {/* FAQ teaser */}
          <div className="bg-gold-400/5 border border-gold-400/20 rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-2">{t('ctaTitle')}</h3>
            <p className="text-anthracite-400 text-sm mb-4">
              {t('ctaSubtitle')}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-gold-400 text-anthracite-950 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors"
            >
              {t('ctaButton')}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
