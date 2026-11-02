'use client';

import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { useClientLocale } from '@/i18n/client';

type Stats = { views: number; sessions: number; profileViews: number; productViews: number; requests: number | null; from: string; to: string; firstViewAt: string | null };

export default function TrafficStats({ audience }: { audience: 'admin' | 'supplier' }) {
  const en = useClientLocale() === 'en';
  const [days, setDays] = useState(30);
  const [reload, setReload] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [environment, setEnvironment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false); setStats(null);
    void fetch(`/api/analytics?days=${days}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('analytics');
        const result = await response.json();
        if (!controller.signal.aborted) { setStats(result.stats); setEnvironment(result.environment); }
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, reload]);
  const format = (value: number) => value.toLocaleString(en ? 'en-GB' : 'ro-RO');
  const cards = stats ? [
    [audience === 'admin' ? (en ? 'Application views' : 'Vizualizări aplicație') : (en ? 'Profile views' : 'Vizualizări profil'), audience === 'admin' ? stats.views : stats.profileViews],
    [en ? 'Distinct browser sessions' : 'Sesiuni de browser distincte', stats.sessions],
    [en ? 'Product views' : 'Vizualizări produse', stats.productViews],
    ...(stats.requests === null ? [] : [[en ? 'Contact requests' : 'Cereri de contact', stats.requests]]),
  ] as [string, number][] : [];
  return <section aria-label={en ? 'Traffic monitoring' : 'Monitorizare vizualizări'} className="mb-8 rounded-2xl border border-anthracite-700 bg-anthracite-900 p-4 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white"><BarChart3 className="h-5 w-5 text-gold-400" aria-hidden="true" />{en ? 'Traffic monitoring' : 'Monitorizare vizualizări'}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-anthracite-200">{en ? 'Period' : 'Perioadă'}
          <select className="min-h-11 rounded-lg border border-anthracite-600 bg-anthracite-800 px-3 text-white" value={days} onChange={event => setDays(Number(event.target.value))}>
            {[7, 30, 90].map(value => <option value={value} key={value}>{value} {en ? 'days' : 'zile'}</option>)}
          </select>
        </label>
        <button type="button" disabled={loading} className="flex min-h-11 items-center gap-2 rounded-lg border border-anthracite-600 px-3 text-sm text-white disabled:opacity-50" onClick={() => setReload(value => value + 1)}><RefreshCw className="h-4 w-4" aria-hidden="true" />{en ? 'Refresh' : 'Actualizează'}</button>
      </div>
    </div>
    {loading && <p role="status" className="text-sm text-anthracite-300">{en ? 'Loading statistics…' : 'Se încarcă statisticile…'}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{en ? 'Statistics are unavailable. Try refreshing.' : 'Statisticile nu sunt disponibile. Încearcă din nou cu Actualizează.'}</p>}
    {!loading && stats && <>
      <dl className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-anthracite-700 bg-anthracite-800/50 p-4"><dt className="text-sm text-anthracite-200">{label}</dt><dd className="mt-2 break-words text-3xl font-bold tabular-nums text-gold-400">{format(value)}</dd></div>)}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-anthracite-300">{en ? 'Measured since tracking was enabled, for visitors who accept analytics. Sessions represent browser tabs, not identified people. Your own profile and product visits are excluded.' : 'Măsurate de la activarea monitorizării, pentru vizitatorii care acceptă analiza. Sesiunile reprezintă file de browser, nu persoane identificate. Vizitele proprii pe profil și produse sunt excluse.'}</p>
      {audience === 'supplier' && <p className="mt-2 text-xs text-anthracite-300">{en ? 'Product figures below retain the previous lifetime session counter.' : 'Tabelul produselor de mai jos păstrează contorul anterior de sesiuni cumulate.'}</p>}
      {environment !== 'production' && <p className="mt-2 text-xs text-gold-300">{en ? 'Preview statistics are isolated from the live application. Contact requests are shown only in production.' : 'Statisticile preview sunt separate de aplicația live. Cererile de contact sunt afișate doar în producție.'}</p>}
      {stats.views === 0 && <p className="mt-2 text-sm text-anthracite-300">{en ? 'No measured views in this period yet.' : 'Nu există încă vizualizări măsurate în această perioadă.'}</p>}
    </>}
  </section>;
}
