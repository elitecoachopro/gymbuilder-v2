'use client';
import { loginHref } from '@/lib/journeys';
import { useState } from 'react';
import Link from 'next/link';
import { useUiText } from '@/i18n/useUiText';
export default function VerificationResult({ message, email, returnTo }: { message: string; email: string; returnTo?: string | null }) {
  const ui = useUiText();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  async function resend() {
    setBusy(true); setFeedback('');
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      setFeedback(data.message || data.error || ui('Confirmarea nu a putut fi retrimisă.'));
    } catch { setFeedback(ui('Eroare de conexiune.')); } finally { setBusy(false); }
  }
  return <section className="rounded-xl border border-gold-400/30 p-6 space-y-4">
    <h2 className="text-xl font-bold">{ui('Cont creat')}</h2><p role="status">{ui(message)}</p>
    <p>{ui('Confirmă adresa folosind linkul din email. Dacă nu a ajuns, verifică Spam sau solicită retrimiterea.')}</p>
    <div className="flex flex-wrap gap-3"><Link href={returnTo ? loginHref(returnTo) : "/login"} className="btn-primary">{ui('Autentificare')}</Link><button type="button" className="btn-secondary min-h-11" disabled={busy} onClick={resend}>{ui(busy ? 'Se retrimite…' : 'Retrimite confirmarea emailului')}</button></div>
    {feedback && <p role="status">{ui(feedback)}</p>}
  </section>;
}
