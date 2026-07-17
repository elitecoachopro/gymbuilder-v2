'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailX, CheckCircle, Loader2 } from 'lucide-react';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || null;
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-email'>('loading');

  useEffect(() => {
    if (!email) {
      setStatus('no-email');
      return;
    }
    handleUnsubscribe();
  }, [email]);

  async function handleUnsubscribe() {
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen bg-anthracite-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-anthracite-800 border border-anthracite-700 rounded-2xl p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-gold-400 animate-spin mx-auto mb-4" />
            <p className="text-white">Se procesează dezabonarea...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Dezabonat cu succes</h1>
            <p className="text-anthracite-400 text-sm">Nu vei mai primi email-uri newsletter de la GymBuilder.</p>
            <Link href="/" className="inline-block mt-6 text-gold-400 hover:text-gold-300 text-sm">
              ← Înapoi la GymBuilder
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <MailX className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Eroare</h1>
            <p className="text-anthracite-400 text-sm">Nu am putut procesa dezabonarea. Încearcă din nou.</p>
            <Link href="/" className="inline-block mt-6 text-gold-400 hover:text-gold-300 text-sm">
              ← Înapoi la GymBuilder
            </Link>
          </>
        )}
        {status === 'no-email' && (
          <>
            <MailX className="w-12 h-12 text-anthracite-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Link invalid</h1>
            <p className="text-anthracite-400 text-sm">Linkul de dezabonare este invalid.</p>
            <Link href="/" className="inline-block mt-6 text-gold-400 hover:text-gold-300 text-sm">
              ← Înapoi la GymBuilder
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
