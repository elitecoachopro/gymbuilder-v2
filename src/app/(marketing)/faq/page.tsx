'use client';

import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, ShoppingCart, Package, CreditCard, Shield } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

function AccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-anthracite-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-1 text-left group"
      >
        <span className={`text-sm font-medium transition-colors ${isOpen ? 'text-gold-400' : 'text-white group-hover:text-gold-400'}`}>
          {question}
        </span>
        <ChevronDown className={`w-4 h-4 text-anthracite-400 shrink-0 ml-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold-400' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
        <p className="text-anthracite-400 text-sm leading-relaxed px-1">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const { t } = useClientTranslations('faq');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const icons = [ShoppingCart, Package, CreditCard, Shield];
  const colors = ['blue', 'emerald', 'gold', 'purple'];
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    gold: 'bg-gold-400/10 border-gold-400/30 text-gold-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  const categories = [
    { key: 'clients', itemCount: 4 },
    { key: 'suppliers', itemCount: 4 },
    { key: 'payments', itemCount: 3 },
    { key: 'account', itemCount: 3 },
  ];

  return (
    <main className="min-h-screen">
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-anthracite-400 hover:text-gold-400 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> {t('backHome')}
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{t('title')}</h1>
          <p className="text-anthracite-400 mb-12 max-w-2xl">
            {t('subtitle')}{' '}
            <Link href="/contact" className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors">
              {t('contactUs')}
            </Link>
          </p>

          <div className="space-y-8">
            {categories.map((category, catIdx) => {
              const Icon = icons[catIdx];
              const color = colors[catIdx];
              return (
                <div key={catIdx} className="bg-anthracite-900 border border-anthracite-800 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-9 h-9 border rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{t(`categories.${category.key}.title`)}</h2>
                  </div>
                  <div>
                    {Array.from({ length: category.itemCount }, (_, itemIdx) => {
                      const key = `${catIdx}-${itemIdx}`;
                      return (
                        <AccordionItem
                          key={key}
                          question={t(`categories.${category.key}.items.${itemIdx}.question`)}
                          answer={t(`categories.${category.key}.items.${itemIdx}.answer`)}
                          isOpen={!!openItems[key]}
                          onToggle={() => toggleItem(key)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 bg-gold-400/5 border border-gold-400/20 rounded-2xl p-6 md:p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-2">{t('ctaTitle')}</h3>
            <p className="text-anthracite-400 text-sm mb-4">
              {t('ctaSubtitle')}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-gold-400 text-anthracite-950 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors"
            >
              {t('contactUs')}
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
