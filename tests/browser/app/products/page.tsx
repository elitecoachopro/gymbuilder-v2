'use client';
import { useState } from 'react';
import Link from 'next/link';
import TrafficTracker from '../../../../src/components/TrafficTracker';
import CookieConsent from '../../../../src/components/CookieConsent';

export default function TrafficCheck() {
  const [journal, setJournal] = useState('');
  return <main className="p-6 space-y-4">
    <TrafficTracker />
    <h1>TEST local — ciclul contoarelor</h1>
    <nav className="flex gap-4"><Link href="/products">Produse fixture</Link><Link href="/suppliers">Furnizori fixture</Link></nav>
    <button type="button" className="p-3 border" onClick={() => {
      localStorage.setItem('gymbuilder_cookie_consent', 'essential');
      window.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: 'essential' }));
    }}>Revocă analiza în fixture</button>
    <button type="button" className="p-3 border" onClick={async () => setJournal(JSON.stringify(await (await fetch('/api/analytics/view')).json()))}>Citește jurnalul real</button>
    <output className="block whitespace-pre-wrap break-all">{journal}</output>
    <CookieConsent />
  </main>;
}
