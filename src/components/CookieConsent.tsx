'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'gymbuilder_cookie_consent';

export type CookieConsentValue = 'all' | 'essential' | null;

export function getCookieConsent(): CookieConsentValue {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === 'all' || value === 'essential') return value;
  return null;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'all');
    setVisible(false);
    // Dispatch event so analytics scripts can initialize
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: 'all' }));
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'essential');
    setVisible(false);
    window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: 'essential' }));
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-anthracite-900 border border-anthracite-700 rounded-2xl p-6 shadow-2xl shadow-black/50">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Text */}
          <div className="flex-1">
            <p className="text-white text-sm leading-relaxed">
              Folosim cookie-uri pentru a asigura funcționarea corectă a site-ului și, cu acordul tău, pentru analiză și îmbunătățirea experienței.
              Cookie-urile non-esențiale nu se activează fără consimțământul tău explicit.{' '}
              <Link
                href="/cookie-policy"
                className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors"
              >
                Detalii complete
              </Link>
            </p>
          </div>
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center shrink-0">
            <button
              onClick={handleEssentialOnly}
              className="px-5 py-2.5 text-sm font-medium text-anthracite-300 border border-anthracite-600 rounded-lg hover:border-anthracite-500 hover:text-white transition-colors"
            >
              Doar esențiale
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2.5 text-sm font-bold bg-gold-400 text-anthracite-950 rounded-lg hover:bg-gold-300 transition-colors"
            >
              Acceptă toate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
