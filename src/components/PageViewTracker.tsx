'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getCookieConsent } from '@/components/CookieConsent';
import { analyticsPath } from '@/lib/analytics';

export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const path = analyticsPath(pathname);
    if (!path) return;
    function record() {
      if (getCookieConsent() !== 'all') return;
      try {
        let session = sessionStorage.getItem('gb_analytics_session');
        if (!session) {
          session = crypto.randomUUID();
          sessionStorage.setItem('gb_analytics_session', session);
        }
        void fetch('/api/analytics/views', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, session_id: session, consent: 'all' }),
          keepalive: true,
        }).catch(() => {});
      } catch { /* Storage blocked: leave analytics disabled. */ }
    }
    function consentChanged(event: StorageEvent) {
      if (event.key === 'gymbuilder_cookie_consent' || event.key === null) record();
    }
    record();
    window.addEventListener('cookie-consent-changed', record);
    window.addEventListener('storage', consentChanged);
    return () => {
      window.removeEventListener('cookie-consent-changed', record);
      window.removeEventListener('storage', consentChanged);
    };
  }, [pathname]);
  return null;
}
