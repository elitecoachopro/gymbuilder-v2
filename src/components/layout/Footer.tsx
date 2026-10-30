'use client';

import { useUiText } from '@/i18n/useUiText';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';

export default function Footer() {
  const ui = useUiText();
  const { t, locale } = useClientTranslations('footer');

  return (
    <footer className="bg-anthracite-950 border-t border-anthracite-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Platformă */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('platform')}</h4>
            <ul className="space-y-3">
              <li><Link href="/products?condition=new" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('newEquipment')}</Link></li>
              <li><Link href="/products?condition=used" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('usedEquipment')}</Link></li>
              <li><Link href="/suppliers" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('suppliers')}</Link></li>
              <li><Link href="/#super-pret" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{locale === 'en' ? 'Super Price' : 'Super Preț'}</Link></li>
              <li><Link href="/construieste-sala" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{locale === 'en' ? 'Gym services' : 'Servicii pentru sală'}</Link></li>
              <li><Link href="/configurator/studio" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{ui("Proiectează sala")}</Link></li>
              <li><Link href="/consultation" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('consultation')}</Link></li>
            </ul>
          </div>

          {/* Companie */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('company')}</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('aboutUs')}</Link></li>
              <li><Link href="/cum-functioneaza" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('howItWorks')}</Link></li>
              <li><Link href="/faq" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('faq')}</Link></li>
              <li><Link href="/contact" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('contact')}</Link></li>
              <li><Link href="/blog" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('blog')}</Link></li>
            </ul>
          </div>

          {/* Cont */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('account')}</h4>
            <ul className="space-y-3">
              <li><Link href="/register/supplier" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('becomeSupplier')}</Link></li>
              <li><Link href="/pricing" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('pricing')}</Link></li>
              <li><Link href="/register/client" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('registerClient')}</Link></li>
              <li><Link href="/login" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('login')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-3">
              <li><Link href="/terms" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/delete-account" className="text-anthracite-400 hover:text-gold-400 text-sm">{locale === 'en' ? 'Delete account' : 'Șterge contul'}</Link></li>
              <li><Link href="/report" className="text-anthracite-400 hover:text-gold-400 text-sm">{locale === 'en' ? 'Report content' : 'Raportează conținut'}</Link></li>
              <li><Link href="/cookie-policy" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('cookiePolicy')}</Link></li>
              <li><Link href="/return-policy" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{t('returnPolicy')}</Link></li>
              <li>
                <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">ANPC</a>
                {ui(' / ')}
                <a href="https://consumer-redress.ec.europa.eu/dispute-resolution-bodies" target="_blank" rel="noopener noreferrer" className="text-anthracite-400 hover:text-gold-400 text-sm transition-colors">{locale === 'en' ? 'EU dispute resolution' : 'Soluționarea litigiilor în UE'}</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-anthracite-800 pt-8 pb-8">
          <NewsletterForm />
        </div>

        {/* ANPC & SOL notice */}
        <div className="border-t border-anthracite-800 pt-8 pb-8">
          <p className="text-anthracite-500 text-xs text-center leading-relaxed max-w-2xl mx-auto">
            {locale === 'en' ? 'For consumer dispute resolution information, consult' : 'Pentru informații despre soluționarea litigiilor de consum, consultă'}{ui(' ')}
            <a href="https://consumer-redress.ec.europa.eu/dispute-resolution-bodies" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 transition-colors">{locale === 'en' ? 'EU dispute resolution bodies' : 'organismele de soluționare a litigiilor din UE'}</a>{ui(' ')}
            {t('anpcOr')}{ui(' ')}
            <a href="https://anpc.ro" target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 transition-colors">ANPC</a>.
          </p>
        </div>

        {/* Bottom */}
        <div className="border-t border-anthracite-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Image
              src="/logo-bold-v2.png"
              alt="Gym Builder"
              width={1120}
              height={488}
              className="h-16 w-auto object-contain rounded"
            />
          </div>
          <p className="text-anthracite-500 text-sm">
            &copy; {ui(new Date().getFullYear())} Gym Builder. {t('allRights')}
          </p>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const ui = useUiText();
  const { t } = useClientTranslations('footer');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message || t('newsletterSuccess'));
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || t('newsletterError'));
      }
    } catch {
      setStatus('error');
      setMessage(t('connectionError'));
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <CheckCircle className="w-5 h-5 text-emerald-400" />
        <p className="text-emerald-400 text-sm font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div id="newsletter" className="max-w-lg mx-auto text-center scroll-mt-40">
      <h4 className="text-white font-semibold mb-2">{t('newsletterTitle')}</h4>
      <p className="text-anthracite-400 text-sm mb-4">{t('newsletterSubtitle')}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          aria-label={ui("Adresa de email pentru newsletter")}
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
          placeholder={ui(t('newsletterPlaceholder'))}
          className="flex-1 min-w-0 bg-anthracite-800 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
          disabled={status === 'loading'}
          required
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          className="bg-gold-400 text-anthracite-950 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {t('subscribe')}
        </button>
      </form>
      {status === 'error' && (
        <p role="alert" className="text-red-400 text-xs mt-2">{message}</p>
      )}
    </div>
  );
}
