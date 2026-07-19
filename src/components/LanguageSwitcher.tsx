'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { useClientLocale } from '@/i18n/client';

export default function LanguageSwitcher() {
  const locale = useClientLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  async function switchLocale(newLocale: string) {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: newLocale }),
    });
    // Dispatch event for client components
    window.dispatchEvent(new Event('locale-changed'));
    startTransition(() => {
      router.refresh();
    });
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isPending ? 'opacity-50 cursor-wait' : 'hover:bg-anthracite-800'
        } text-anthracite-300 hover:text-white`}
        disabled={isPending}
        aria-label="Schimbă limba"
      >
        <span className="text-base">{locale === 'ro' ? '🇷🇴' : '🇬🇧'}</span>
        <span className="uppercase text-xs tracking-wider">{locale}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-anthracite-800 border border-anthracite-700 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
            <button
              onClick={() => switchLocale('ro')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                locale === 'ro' ? 'bg-gold-400/10 text-gold-400' : 'text-anthracite-300 hover:bg-anthracite-700 hover:text-white'
              }`}
            >
              <span>🇷🇴</span>
              <span>Română</span>
            </button>
            <button
              onClick={() => switchLocale('en')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                locale === 'en' ? 'bg-gold-400/10 text-gold-400' : 'text-anthracite-300 hover:bg-anthracite-700 hover:text-white'
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
