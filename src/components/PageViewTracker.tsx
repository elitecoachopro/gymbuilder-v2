'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getCookieConsent } from '@/components/CookieConsent';
import { analyticsPath } from '@/lib/analytics';
import { trafficContact, trafficSource } from '@/lib/traffic-attribution';

export default function PageViewTracker() {
  const pathname = usePathname();
  const currentView = useRef<{ path: string; id: string } | null>(null);
  useEffect(() => {
    const path = analyticsPath(pathname);
    if (!path) { currentView.current = null; return; }
    function record(kind: 'view' | 'phone' | 'whatsapp' = 'view') {
      if (getCookieConsent() !== 'all') return;
      try {
        let session = sessionStorage.getItem('gb_analytics_session');
        if (!session) {
          session = crypto.randomUUID();
          sessionStorage.setItem('gb_analytics_session', session);
        }
        let source = sessionStorage.getItem('gb_analytics_source');
        if (!source) {
          source = trafficSource(location.search, document.referrer, location.origin);
          sessionStorage.setItem('gb_analytics_source', source);
        }
        if (!currentView.current || currentView.current.path !== path) currentView.current = { path: path!, id: crypto.randomUUID() };
        const eventId = kind === 'view' ? currentView.current.id : crypto.randomUUID();
        void fetch('/api/analytics/events', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, session_id: session, consent: 'all', source, kind, event_id: eventId }),
          keepalive: true,
        }).catch(() => {});
      } catch { /* Storage blocked: leave analytics disabled. */ }
    }
    function consentGranted() { record(); }
    function consentChanged(event: StorageEvent) {
      if (event.key === 'gymbuilder_cookie_consent' || event.key === null) record();
    }
    function contactClicked(event: MouseEvent) {
      if (event.defaultPrevented || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      const kind = anchor && trafficContact(anchor.href);
      if (kind) record(kind);
    }
    record();
    window.addEventListener('cookie-consent-changed', consentGranted);
    window.addEventListener('storage', consentChanged);
    document.addEventListener('click', contactClicked);
    return () => {
      window.removeEventListener('cookie-consent-changed', consentGranted);
      window.removeEventListener('storage', consentChanged);
      document.removeEventListener('click', contactClicked);
    };
  }, [pathname]);
  return null;
}
