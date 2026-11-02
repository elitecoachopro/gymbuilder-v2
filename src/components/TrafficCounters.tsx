'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Eye, Loader2, RefreshCw, Users } from 'lucide-react';
import { useClientLocale } from '@/i18n/client';
import type { TrafficSummary } from '@/lib/analytics';

const translations = {
  ro: {
    admin: 'Vizualizările aplicației', supplier: 'Vizibilitatea profilului și produselor tale',
    period: 'Perioada de monitorizare', days: 'zile', refresh: 'Actualizează', loading: 'Se încarcă statisticile…',
    error: 'Statisticile nu au putut fi încărcate. Încearcă din nou.',
    views: 'Vizualizări', sessions: 'Sesiuni unice', profiles: 'Vizualizări profil', products: 'Vizualizări produse',
    note: 'Se numără o vizualizare pe pagină, sesiune și zi UTC, numai cu acordul pentru analiză. Sesiunile nu reprezintă persoane distincte. Vizitele administratorului și ale furnizorului pe propriul profil sau produse sunt excluse.',
    history: 'Aceste contoare colectează date de la activare. Istoricul anterior al produselor rămâne în statisticile de mai jos.',
    empty: 'Nicio vizualizare în perioada selectată. Contoarele se vor actualiza după primele vizite cu acord pentru analiză.',
    daily: 'Evoluție zilnică', date: 'Data (UTC)', pages: 'Cele mai vizualizate pagini', since: 'Primele date înregistrate',
  },
  en: {
    admin: 'Application views', supplier: 'Your profile and product visibility',
    period: 'Reporting period', days: 'days', refresh: 'Refresh', loading: 'Loading statistics…',
    error: 'Statistics could not be loaded. Please try again.',
    views: 'Views', sessions: 'Unique sessions', profiles: 'Profile views', products: 'Product views',
    note: 'One view per page, session and UTC day is counted, only with analytics consent. Sessions do not represent distinct people. Administrator visits and supplier visits to their own profile or products are excluded.',
    history: 'These counters collect data from activation. Previous product history remains in the statistics below.',
    empty: 'No views in the selected period. Counters will update after the first visits with analytics consent.',
    daily: 'Daily activity', date: 'Date (UTC)', pages: 'Most viewed pages', since: 'First recorded data',
  },
};

export default function TrafficCounters({ audience }: { audience: 'admin' | 'supplier' }) {
  const locale = useClientLocale();
  const copy = translations[locale === 'en' ? 'en' : 'ro'];
  const [days, setDays] = useState('30');
  const [refresh, setRefresh] = useState(0);
  const [summary, setSummary] = useState<TrafficSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false); setSummary(null);
    async function load() {
      try {
        const response = await fetch(`/api/analytics/summary?days=${days}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!data.summary?.totals || !Array.isArray(data.summary.daily) || !Array.isArray(data.summary.pages)) throw new Error();
        if (!controller.signal.aborted) setSummary(data.summary);
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [days, refresh]);

  const number = (value: number) => value.toLocaleString(locale === 'en' ? 'en-GB' : 'ro-RO');
  const date = (value: string) => new Date(value).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ro-RO', { timeZone: 'UTC' });
  return (
    <section aria-label={copy[audience]} aria-busy={loading} className="mb-8 min-w-0 rounded-2xl border border-anthracite-700 bg-anthracite-900 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white"><BarChart3 aria-hidden="true" className="h-5 w-5 shrink-0 text-gold-400" />{copy[audience]}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor={`traffic-period-${audience}`}>{copy.period}</label>
          <select id={`traffic-period-${audience}`} value={days} onChange={e => setDays(e.target.value)} className="min-h-11 rounded-lg border border-anthracite-600 bg-anthracite-800 px-3 text-sm text-white">
            {[7, 30, 90].map(n => <option key={n} value={n}>{n} {copy.days}</option>)}
          </select>
          <button type="button" onClick={() => setRefresh(n => n + 1)} disabled={loading} className="flex min-h-11 items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-sm text-white hover:bg-anthracite-800 disabled:opacity-50"><RefreshCw aria-hidden="true" className="h-4 w-4" />{copy.refresh}</button>
        </div>
      </div>
      {loading ? <p role="status" className="flex items-center gap-2 py-8 text-sm text-anthracite-300"><Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />{copy.loading}</p>
        : error ? <p role="alert" className="py-4 text-sm text-red-300">{copy.error}</p>
          : summary && <>
            <dl className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {([
                ['views', Eye, 'views'], ['sessions', Users, 'sessions'], ['profiles', Eye, 'profile_views'], ['products', Eye, 'product_views'],
              ] as const).map(([label, Icon, totalKey]) => (
                <div key={label} className="min-w-0 rounded-xl border border-anthracite-700 bg-anthracite-800/50 p-3 sm:p-4">
                  <dt className="mb-2 flex items-center gap-2 text-xs leading-relaxed text-anthracite-300"><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-gold-400" />{copy[label]}</dt>
                  <dd className="break-words text-2xl font-bold tabular-nums text-white">{number(summary.totals[totalKey])}</dd>
                </div>
              ))}
            </dl>
            {summary.totals.views === 0 ? <p className="mb-4 text-sm text-anthracite-300">{copy.empty}</p> : <>
              <details className="mb-5 rounded-lg border border-anthracite-700 p-3">
                <summary className="cursor-pointer py-2 text-sm font-semibold text-gold-400">{copy.daily}</summary>
                <table className="mt-2 w-full text-left text-sm">
                  <thead><tr className="text-anthracite-300"><th scope="col" className="py-2">{copy.date}</th><th scope="col" className="py-2 text-right">{copy.views}</th><th scope="col" className="py-2 text-right">{copy.sessions}</th></tr></thead>
                  <tbody>{summary.daily.map(day => <tr key={day.day} className="border-t border-anthracite-800"><th scope="row" className="py-2 font-normal text-anthracite-300">{date(day.day)}</th><td className="py-2 text-right tabular-nums">{number(day.views)}</td><td className="py-2 text-right tabular-nums">{number(day.sessions)}</td></tr>)}</tbody>
                </table>
              </details>
              <h3 className="mb-2 text-sm font-semibold text-white">{copy.pages}</h3>
              <ul className="mb-4 space-y-2">{summary.pages.map(page => <li key={page.path} className="flex min-w-0 items-start justify-between gap-3 text-sm"><span className="min-w-0 break-all text-anthracite-300">{page.path}</span><span className="shrink-0 font-semibold tabular-nums text-white">{number(page.views)}</span></li>)}</ul>
            </>}
            {summary.since && <p className="mb-2 text-xs text-anthracite-400">{copy.since}: {date(summary.since)}</p>}
          </>}
      <p className="text-xs leading-relaxed text-anthracite-400">{copy.note}</p>
      {audience === 'supplier' && <p className="mt-2 text-xs leading-relaxed text-anthracite-400">{copy.history}</p>}
    </section>
  );
}
