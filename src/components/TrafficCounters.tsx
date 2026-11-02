'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TrafficReportDetails from '@/components/TrafficReportDetails';
import { BarChart3, Eye, Loader2, RefreshCw, Users } from 'lucide-react';
import { useClientLocale } from '@/i18n/client';
import type { DetailedTrafficReport } from '@/lib/analytics';

const translations = {
  ro: {
    admin: 'Raport de activitate Gym Builder', supplier: 'Vizibilitatea profilului și produselor tale',
    selectedDay: 'Ziua analizată', period: 'Perioada de monitorizare', singular: 'zi', days: 'zile', refresh: 'Actualizează', loading: 'Se încarcă statisticile…',
    error: 'Statisticile nu au putut fi încărcate. Încearcă din nou.',
    views: 'Accesări pagini', sessions: 'Sesiuni unice', profiles: 'Vizualizări profil', products: 'Vizualizări produse',
    note: 'Accesările includ reveniri și reîncărcări; retrimiterea aceluiași eveniment nu se dublează. Traficul se măsoară numai cu acord pentru analiză. Sesiunile nu sunt persoane distincte. Administratorii și vizitele furnizorilor pe propriile materiale sunt excluse. Orele sunt afișate pentru București.',
    history: 'Raportul detaliat începe de la activarea lui. Istoricul produselor din dashboard păstrează numărarea unică pe pagină, sesiune și zi UTC.',
    empty: 'Nicio vizualizare în perioada selectată. Contoarele se vor actualiza după primele vizite cu acord pentru analiză.',
    daily: 'Evoluție zilnică', date: 'Data (București)', pages: 'Cele mai vizualizate pagini', since: 'Primele date înregistrate', open: 'Deschide raportul separat',
  },
  en: {
    admin: 'Gym Builder activity report', supplier: 'Your profile and product visibility',
    selectedDay: 'Selected day', period: 'Reporting period', singular: 'day', days: 'days', refresh: 'Refresh', loading: 'Loading statistics…',
    error: 'Statistics could not be loaded. Please try again.',
    views: 'Page accesses', sessions: 'Unique sessions', profiles: 'Profile views', products: 'Product views',
    note: 'Accesses include return visits and reloads; retries of the same event are not counted twice. Traffic is measured only with analytics consent. Sessions are not distinct people. Administrators and suppliers visiting their own content are excluded. Times use Bucharest time.',
    history: 'The detailed report starts at activation. Product history in your dashboard retains one view per page, session and UTC day.',
    empty: 'No views in the selected period. Counters will update after the first visits with analytics consent.',
    daily: 'Daily activity', date: 'Date (Bucharest)', pages: 'Most viewed pages', since: 'First recorded data', open: 'Open dedicated report',
  },
};

export default function TrafficCounters({ audience, standalone = false }: { audience: 'admin' | 'supplier'; standalone?: boolean }) {
  const locale = useClientLocale();
  const copy = translations[locale === 'en' ? 'en' : 'ro'];
  const [days, setDays] = useState('30');
  const [day, setDay] = useState('');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const firstDay = new Date(Date.parse(`${today}T00:00:00Z`) - (Number(days) - 1) * 86400000).toISOString().slice(0, 10);
  const [refresh, setRefresh] = useState(0);
  const [summary, setSummary] = useState<DetailedTrafficReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false); setSummary(null);
    async function load() {
      try {
        const response = await fetch(`/api/analytics/report?days=${days}${day ? `&day=${day}` : ''}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!data.summary?.totals || !Array.isArray(data.summary.daily) || !Array.isArray(data.summary.pages) || !Array.isArray(data.summary.hourly) || !Array.isArray(data.summary.sources) || !data.summary.actions || !data.summary.business) throw new Error();
        if (!controller.signal.aborted) setSummary(data.summary);
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [days, day, refresh]);

  const number = (value: number) => value.toLocaleString(locale === 'en' ? 'en-GB' : 'ro-RO');
  const date = (value: string) => new Date(value).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ro-RO', { timeZone: 'Europe/Bucharest' });
  return (
    <section aria-label={copy[audience]} aria-busy={loading} className="mb-8 min-w-0 rounded-2xl border border-anthracite-700 bg-anthracite-900 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white"><BarChart3 aria-hidden="true" className="h-5 w-5 shrink-0 text-gold-400" />{copy[audience]}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor={`traffic-period-${audience}`}>{copy.period}</label>
          <select id={`traffic-period-${audience}`} value={days} onChange={e => { setDays(e.target.value); setDay(''); }} className="min-h-11 rounded-lg border border-anthracite-600 bg-anthracite-800 px-3 text-sm text-white">
            {[1, 7, 30, 90].map(n => <option key={n} value={n}>{n} {n === 1 ? copy.singular : copy.days}</option>)}
          </select>
          <label className="sr-only" htmlFor={`traffic-day-${audience}`}>{copy.selectedDay}</label>
          <input id={`traffic-day-${audience}`} type="date" value={day || today} min={firstDay} max={today} onChange={e => setDay(e.target.value)} onBlur={e => setDay(e.currentTarget.value)} className="min-h-11 max-w-full rounded-lg border border-anthracite-600 bg-anthracite-800 px-3 text-sm text-white" />
          <button type="button" onClick={() => setRefresh(n => n + 1)} disabled={loading} className="flex min-h-11 items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-sm text-white hover:bg-anthracite-800 disabled:opacity-50"><RefreshCw aria-hidden="true" className="h-4 w-4" />{copy.refresh}</button>
        </div>
      </div>
      {!standalone && <Link href="/statistici" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-gold-400 underline underline-offset-4">{copy.open}</Link>}
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
            <TrafficReportDetails report={summary} audience={audience} />
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
