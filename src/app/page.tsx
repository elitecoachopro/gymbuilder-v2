'use client';


import Link from 'next/link';
import './home-sport.css';
import { useState, useEffect } from 'react';
import Footer from '@/components/layout/Footer';
import SearchWidget from '@/components/SearchWidget';
import MarketNavigation from '@/components/MarketNavigation';
import PromotedOffers from '@/components/PromotedOffers';
import { Star, ArrowRight, Sparkles, RefreshCw, Building2 } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

export default function HomePage() {
  const { t, locale } = useClientTranslations('home');
  const [stats, setStats] = useState<{ products: number; suppliers: number; brands: number }>({ products: 0, suppliers: 0, brands: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {}
    }
    fetchStats();
  }, []);

  return (
    <main className="home-sport min-h-screen">

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-400/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold-400/3 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 rounded-full px-4 py-1.5 mb-8">
              <Star className="w-4 h-4 text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">{t('badge')}</span>
            </div>

            <h1 className="sport-hero-title mb-6">
              {t('heroTitle1')}
              <span className="block gold-gradient">{t('heroTitle2')}</span>
            </h1>

            <p className="text-lg sm:text-xl text-anthracite-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Search Widget */}
            <div className="mb-12">
              <SearchWidget />
            </div>

            <ol aria-label={locale === 'en' ? 'How to buy' : 'Cum ajungi la furnizor'} className="grid gap-3 text-left text-sm text-anthracite-200 sm:grid-cols-3">
              {(locale === 'en' ? ['Find your equipment', 'Open the supplier contact details', 'Agree the purchase directly'] : ['Alege echipamentul', 'Vezi contactul furnizorului', 'Stabilește achiziția direct']).map((label, index) => <li key={label} className="flex items-center gap-3 rounded-lg border border-anthracite-700 bg-anthracite-900 p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-400/10 font-bold text-gold-400">{index + 1}</span>{label}</li>)}
            </ol>
          </div>
        </div>
      </section>

      <PromotedOffers />

      <section className="px-4 pb-14 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <p className="mb-8 text-sm text-anthracite-300">{locale === 'en' ? 'Browse the catalog and use public contact details without creating an account.' : 'Explorezi catalogul și folosești datele publice de contact fără să creezi un cont.'}</p>

            {/* 3 Main CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CTA 1 - Echipamente Noi */}
              <Link href="/products?condition=new" className="group bg-anthracite-800 border border-anthracite-700 rounded-xl p-6 sm:p-8 text-left hover:border-gold-400/60 transition-all duration-200">
                <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-400/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('ctaNewTitle')}</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">{t('ctaNewDesc')}</p>
                <span className="inline-flex items-center gap-2 text-gold-400 font-bold text-sm group-hover:gap-3 transition-all">
                  {t('ctaNewButton')} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* CTA 2 - Echipamente Second-Hand */}
              <Link href="/products?condition=used" className="group bg-anthracite-800 border border-anthracite-700 rounded-xl p-6 sm:p-8 text-left hover:border-gold-400/60 transition-all duration-200">
                <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-400/20 transition-colors">
                  <RefreshCw className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('ctaUsedTitle')}</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">{t('ctaUsedDesc')}</p>
                <span className="inline-flex items-center gap-2 text-gold-400 font-bold text-sm group-hover:gap-3 transition-all">
                  {t('ctaUsedButton')} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              {/* CTA 3 - Construiește-ți sala */}
              <Link href="/configurator" className="group bg-anthracite-800 border border-anthracite-700 rounded-xl p-6 sm:p-8 text-left hover:border-gold-400/40 transition-all duration-200">
                <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold-400/20 transition-colors">
                  <Building2 className="w-6 h-6 text-gold-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{t('ctaBuildTitle')}</h3>
                <p className="text-sm text-anthracite-300 mb-6 leading-relaxed">{t('ctaBuildDesc')}</p>
                <span className="inline-flex items-center gap-2 text-gold-400 font-bold text-sm group-hover:gap-3 transition-all">
                  {t('ctaBuildButton')} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>

            {/* Secondary links */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
              <Link href="/register/supplier" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                {t('supplierCta')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/consultation" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                {t('consultationCta')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link href="/about" className="text-sm text-anthracite-400 hover:text-gold-400 transition-colors inline-flex items-center gap-1">
                {t('aboutCta')} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.products}</div>
                <div className="text-sm text-anthracite-400 mt-1">{t('products')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.suppliers}</div>
                <div className="text-sm text-anthracite-400 mt-1">{t('suppliersLabel')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold-400">{stats.brands}</div>
                <div className="text-sm text-anthracite-400 mt-1">{t('brands')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12"><MarketNavigation /></div>

      <section aria-labelledby="supplier-start-heading" className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col gap-6 rounded-xl border border-gold-400/30 bg-anthracite-900 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div><h2 id="supplier-start-heading" className="text-3xl font-bold text-white">{locale === 'en' ? 'Do you sell fitness equipment?' : 'Vinzi echipamente fitness?'}</h2><p className="mt-2 max-w-xl text-anthracite-300">{locale === 'en' ? 'New or second hand: create your account, verify your company and publish after approval. Free plan available.' : 'Noi sau second hand: creezi contul, verifici firma și publici după aprobare. Ai la dispoziție un plan gratuit.'}</p></div>
          <Link href="/register/supplier" className="btn-primary inline-flex min-h-12 shrink-0 items-center justify-center gap-2">{locale === 'en' ? 'Become a supplier' : 'Devino furnizor'}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
