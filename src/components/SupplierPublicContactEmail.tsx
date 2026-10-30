'use client';

import { useState } from 'react';
import { useClientLocale } from '@/i18n/client';
import { parsePublicContactEmail } from '@/lib/supplier-contact';

export default function SupplierPublicContactEmail({ initialEmail }: { initialEmail: string | null }) {
  const locale = useClientLocale();
  const [email, setEmail] = useState(initialEmail || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const copy = (ro: string, en: string) => locale === 'en' ? en : ro;

  return (
    <form className="mb-6 rounded-xl border border-anthracite-700 p-5" onSubmit={async event => {
      event.preventDefault();
      setError(''); setSaved(false);
      if (!parsePublicContactEmail(email).valid) { setError(copy('Introdu un email valid sau lasă câmpul gol.', 'Enter a valid email or leave the field empty.')); return; }
      setSaving(true);
      try {
        const response = await fetch('/api/supplier/dashboard', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactEmail: email }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || copy('Emailul public nu a putut fi salvat.', 'The public email could not be saved.'));
        setEmail(data.contactEmail || ''); setSaved(true);
      } catch (reason) { setError(reason instanceof Error ? reason.message : copy('Conexiune indisponibilă. Încearcă din nou.', 'Connection unavailable. Please try again.')); }
      finally { setSaving(false); }
    }}>
      <label htmlFor="supplier-contact-email" className="mb-2 block font-semibold text-white">{copy('Email public de contact', 'Public contact email')}</label>
      <p id="supplier-contact-email-help" className="mb-4 text-sm text-anthracite-300">{copy('Vizibil clienților pe profil și produse. Pentru a-l retrage, golește câmpul și salvează. Adresa de autentificare nu se modifică.', 'Visible to customers on your profile and products. To remove it, clear the field and save. Your login email is unchanged.')}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="supplier-contact-email" type="email" autoComplete="off" inputMode="email" maxLength={254} className="input-field min-w-0 flex-1" aria-describedby="supplier-contact-email-help" placeholder="vanzari@companie.ro" value={email} disabled={saving} onChange={event => { setEmail(event.target.value); setSaved(false); setError(''); }} />
        <button type="submit" disabled={saving} className="btn-primary min-h-11 shrink-0 disabled:opacity-60">{saving ? copy('Se salvează…', 'Saving…') : copy('Salvează emailul public', 'Save public email')}</button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      {saved && <p role="status" className="mt-3 text-sm text-green-400">{copy('Datele publice de contact au fost actualizate.', 'Your public contact details have been updated.')}</p>}
    </form>
  );
}
