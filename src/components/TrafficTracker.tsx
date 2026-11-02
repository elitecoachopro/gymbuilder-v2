'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getCookieConsent } from '@/components/CookieConsent';
import { analyticsTarget } from '@/lib/analytics/input';

export default function TrafficTracker() {
  const pathname = usePathname();
  const navigation = useRef<{ path: string; eventId: string; sent: boolean } | null>(null);
  useEffect(() => {
    if (!pathname || !analyticsTarget(pathname)) {
      navigation.current = null;
      return;
    }
    if (navigation.current?.path !== pathname) navigation.current = { path: pathname, eventId: crypto.randomUUID(), sent: false };
    const current = navigation.current;
    const track = () => {
      try {
        if (getCookieConsent() !== 'all') {
          sessionStorage.removeItem('gb_session_id');
          return;
        }
        if (current.sent) return;
        let sessionId = sessionStorage.getItem('gb_session_id');
        if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('gb_session_id', sessionId);
        }
        current.sent = true;
        void fetch('/api/analytics/view', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
          body: JSON.stringify({ path: pathname, eventId: current.eventId, sessionId, consent: true }),
        }).then(response => { if (!response.ok) current.sent = false; }).catch(() => { current.sent = false; });
      } catch { /* Storage blocked: don't track without a stable anonymous session. */ }
    };
    track();
    window.addEventListener('cookie-consent-changed', track);
    window.addEventListener('storage', track);
    return () => {
      window.removeEventListener('cookie-consent-changed', track);
      window.removeEventListener('storage', track);
    };
  }, [pathname]);
  return null;
}
