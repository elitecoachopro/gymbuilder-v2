'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClientLocale } from '@/i18n/client';
import { useUiText } from '@/i18n/useUiText';
import { loginHref } from '@/lib/journeys';
import { serviceProfileSchema, serviceProfileValuesFromRow, type ServiceProfileValues } from '@/lib/gym-services';
import ServiceProfileFields from '@/components/ServiceProfileFields';

export default function SupplierServicesPage() {
  const en = useClientLocale() === 'en', ui = useUiText(), router = useRouter();
  const [value, setValue] = useState<ServiceProfileValues>(() => serviceProfileSchema.parse({}));
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [id, setId] = useState('');
  const [status, setStatus] = useState('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/supplier/services', { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (response.status === 401) { router.replace(loginHref('/supplier/services')); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Eroare la încărcarea profilului.');
      const p = data.supplier;
      setValue(serviceProfileValuesFromRow(p));
      setId(p.id); setStatus(p.status);
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Eroare de conexiune.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [router]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    if (!serviceProfileSchema.safeParse(value).success) { setError('Selectează serviciile și completează zona de acoperire.'); return; }
    setSaving(true);
    try {
      const response = await fetch('/api/supplier/services', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Profilul de service nu a putut fi salvat.');
      const p = data.supplier;
      setValue(serviceProfileValuesFromRow(p));
      setMessage(en ? 'Your service profile has been saved.' : 'Profilul de service a fost salvat.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Eroare de conexiune.'); }
    finally { setSaving(false); }
  }
  return <main className="mx-auto max-w-3xl px-4 py-12">
    <Link className="inline-flex min-h-12 items-center text-gold-300" href="/supplier/dashboard">← {en ? 'Supplier dashboard' : 'Panoul furnizorului'}</Link>
    <h1 className="mt-4 text-3xl font-bold text-white">Gym Service {en ? '& Maintenance' : 'și Mentenanță'}</h1>
    <p className="my-4 text-anthracite-300">{en ? 'Choose your services and tell customers where you work. Your profile is public after approval.' : 'Alege serviciile și spune clienților unde intervii. Profilul devine public după aprobare.'}</p>
    {error && <p ref={errorRef} role="alert" tabIndex={-1} className="mb-4 text-red-400">{ui(error)}</p>}
    {message && <p role="status" className="mb-4 text-green-400">{message}</p>}
    {loading ? <p role="status">{en ? 'Loading profile…' : 'Se încarcă profilul…'}</p> : id && <form onSubmit={save} className="glass-card space-y-6 p-5 sm:p-8">
      <ServiceProfileFields value={value} onChange={next => { setValue(next); setMessage(''); }} disabled={saving} />
      <button className="btn-primary min-h-12 w-full" disabled={saving}>{saving ? (en ? 'Saving…' : 'Se salvează…') : (en ? 'Save service profile' : 'Salvează profilul de service')}</button>
      {status === 'approved' && <Link className="inline-flex min-h-12 items-center text-gold-300" href={`/suppliers/${id}`}>{en ? 'View public profile' : 'Vezi profilul public'}</Link>}
    </form>}
  </main>;
}
