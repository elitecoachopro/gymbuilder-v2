'use client';

import { useUiText } from '@/i18n/useUiText';

import { useRouter } from 'next/navigation';
import { useState, useTransition, useRef, useEffect } from 'react';
import { useClientLocale } from '@/i18n/client';

export default function LanguageSwitcher() {
  const ui = useUiText();
  const locale = useClientLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsOpen(false); triggerRef.current?.focus(); } };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [isOpen]);

  async function switchLocale(newLocale: string) {
    setError(''); setSaving(true);
    try {
      const response = await fetch('/api/locale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: newLocale }) });
      if (!response.ok) throw new Error('Eroare la actualizare.');
      window.dispatchEvent(new Event('locale-changed'));
      startTransition(() => { router.refresh(); });
      setIsOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : 'Eroare de conexiune.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="relative">
      {error && <p role="alert" className="absolute top-full right-0 text-red-400 text-xs">{ui(error)}</p>}
      <button
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-controls="language-options"
        onClick={() => setIsOpen(open => !open)}
        className={`flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isPending ? 'opacity-50 cursor-wait' : 'hover:bg-anthracite-800'
        } text-anthracite-300 hover:text-white`}
        disabled={isPending || saving}
        aria-label={ui("Schimbă limba")}
      >
        <span className="text-base">{ui(locale === 'ro' ? '🇷🇴' : '🇬🇧')}</span>
        <span className="uppercase text-xs tracking-wider">{locale}</span>
      </button>

      {isOpen && (
        <>
          <button type="button" aria-label={ui("Închide")} className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div id="language-options" className="absolute right-0 top-full mt-1 z-50 bg-anthracite-800 border border-anthracite-700 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
            <button
              onClick={() => switchLocale('ro')}
              className={`w-full min-h-11 flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                locale === 'ro' ? 'bg-gold-400/10 text-gold-400' : 'text-anthracite-300 hover:bg-anthracite-700 hover:text-white'
              }`}
            >
              <span>🇷🇴</span>
              <span>{ui("Română")}</span>
            </button>
            <button
              onClick={() => switchLocale('en')}
              className={`w-full min-h-11 flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
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
