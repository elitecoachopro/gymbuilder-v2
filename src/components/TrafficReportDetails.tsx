'use client';

import { useId } from 'react';
import { useClientLocale } from '@/i18n/client';
import type { TrafficSource } from '@/lib/traffic-attribution';
import type { DetailedTrafficReport } from '@/lib/analytics';

export default function TrafficReportDetails({ report, audience }: { report: DetailedTrafficReport; audience: 'admin' | 'supplier' }) {
  const locale = useClientLocale() === 'en' ? 'en-GB' : 'ro-RO';
  const en = locale === 'en-GB';
  const copy = (ro: string, english: string) => en ? english : ro;
  const number = (n: number) => n.toLocaleString(locale);
  const date = (s: string) => new Date(s).toLocaleDateString(locale, { timeZone: 'Europe/Bucharest', day: '2-digit', month: '2-digit' });
  const sourceNames: Record<TrafficSource, string> = { direct: copy('Direct / sursă indisponibilă', 'Direct / unavailable source'), facebook: 'Facebook', instagram: 'Instagram', google: 'Google', bing: 'Bing', email: 'Email', tiktok: 'TikTok', linkedin: 'LinkedIn', campaign: copy('Alte campanii', 'Other campaigns'), referral: copy('Alte site-uri', 'Other websites'), unknown: copy('Necunoscută', 'Unknown') };
  const kindNames = { view: copy('Accesare', 'Page access'), phone: copy('Telefon', 'Phone'), whatsapp: 'WhatsApp' };
  const metrics: [string, number | null][] = [
    [copy('Apăsări telefon', 'Phone clicks'), report.actions.phone], ['WhatsApp', report.actions.whatsapp],
    [copy('Cereri către furnizori', 'Supplier enquiries'), report.business.requests],
    ...(audience === 'admin' ? [
      [copy('Proiecte create', 'Projects created'), report.business.projects_created],
      [copy('Finalizate dintre acestea', 'Completed among these'), report.business.projects_completed],
      [copy('Mesaje generale', 'General messages'), report.business.messages],
    ] as [string, number | null][] : []),
  ];
  return <div className="space-y-5 mb-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {metrics.map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-anthracite-700 p-3"><p className="text-xs leading-relaxed text-anthracite-300">{label}</p><p className="mt-2 text-xl font-bold tabular-nums">{value === null ? '—' : number(value)}</p></div>)}
    </div>
    <p className="text-xs leading-relaxed text-anthracite-300">{copy('Cererile și proiectele sunt înregistrări confirmate în aplicație, independente de acordul pentru analiza traficului. O apăsare nu confirmă efectuarea unui apel sau trimiterea unui mesaj WhatsApp.', 'Enquiries and projects are confirmed application records, independent of traffic analytics consent. A click does not confirm a completed call or WhatsApp message.')}</p>
    {report.daily.length > 1 && <TrafficLine title={copy('Evoluția accesărilor', 'Page access trend')} values={report.daily.map(d => ({ label: date(d.day), value: d.views }))} />}
    <div className="rounded-xl border border-anthracite-700 p-3 sm:p-4">
      <h3 className="mb-3 text-sm font-semibold">{copy('Activitate pe ore · București', 'Hourly activity · Bucharest')} · {date(report.day)}</h3>
      <TrafficLine title={copy('Accesări pe oră', 'Accesses per hour')} values={report.hourly.map(h => ({ label: `${String(h.hour).padStart(2, '0')}:00`, value: h.views }))} />
      <details><summary className="cursor-pointer py-3 text-sm text-gold-400">{copy('Vezi toate orele', 'View every hour')}</summary><ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm sm:grid-cols-4">{report.hourly.map(h => <li key={h.hour} className="flex justify-between gap-2"><span className="text-anthracite-300">{String(h.hour).padStart(2, '0')}:00</span><strong>{number(h.views)}</strong></li>)}</ul></details>
    </div>
    <div className="grid min-w-0 gap-5 lg:grid-cols-2">
      <section className="min-w-0 rounded-xl border border-anthracite-700 p-3 sm:p-4">
        <h3 className="mb-3 text-sm font-semibold">{copy('De unde vin accesările', 'Traffic sources')}</h3>
        <p className="mb-4 text-xs text-anthracite-300">{copy('Prima sursă recunoscută în sesiune. Aplicațiile sociale pot ascunde sursa; nu poate fi reconstituită cu certitudine.', 'First recognized source in a session. Social apps may hide the source; it cannot be reconstructed with certainty.')}</p>
        {report.sources.length === 0 && <p className="text-sm text-anthracite-300">{copy('Încă nu există surse colectate.', 'No sources collected yet.')}</p>}
        <ul className="space-y-3">{report.sources.map(s => <li key={s.source}><div className="mb-1 flex items-center justify-between gap-3 text-sm"><span>{sourceNames[s.source] || sourceNames.unknown}</span><strong>{number(s.views)}</strong></div><div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-anthracite-700"><div className="h-full bg-gold-400" style={{ width: `${report.totals.views ? s.views / report.totals.views * 100 : 0}%` }} /></div></li>)}</ul>
      </section>
      <section className="min-w-0 rounded-xl border border-anthracite-700 p-3 sm:p-4">
        <h3 className="mb-3 text-sm font-semibold">{copy('Ultimele 20 de evenimente din perioadă', 'Latest 20 events in the period')}</h3>
        {report.recent.length === 0 && <p className="text-sm text-anthracite-300">{copy('Încă nu există evenimente.', 'No events yet.')}</p>}
        <ol className="max-h-80 space-y-3 overflow-y-auto">{report.recent.map((r, i) => <li key={`${r.occurred_at}-${i}`} className="border-b border-anthracite-800 pb-2 text-xs leading-relaxed"><div className="flex flex-wrap justify-between gap-2"><strong>{kindNames[r.kind]}</strong><time dateTime={r.occurred_at} className="text-anthracite-300">{new Date(r.occurred_at).toLocaleString(locale, { timeZone: 'Europe/Bucharest', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset' })}</time></div><p className="break-all text-anthracite-300">{r.path}</p><p className="text-anthracite-400">{sourceNames[r.source] || sourceNames.unknown}</p></li>)}</ol>
      </section>
    </div>
  </div>;
}

function TrafficLine({ title, values }: { title: string; values: { label: string; value: number }[] }) {
  const id = useId();
  const maximum = Math.max(1, ...values.map(v => v.value));
  const points = values.map((v, i) => ({ x: 30 + (values.length > 1 ? i / (values.length - 1) * 540 : 270), y: 130 - v.value / maximum * 105 }));
  return <figure className="min-w-0">
    <figcaption id={id} className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold"><span>{title}</span><span aria-hidden="true" className="text-xs font-normal text-anthracite-300">0–{maximum}</span></figcaption>
    <svg role="img" aria-labelledby={id} viewBox="0 0 600 145" className="block w-full text-gold-400">
      <title>{title}</title><desc>{values.map(v => `${v.label}: ${v.value}`).join('; ')}</desc>
      <path d="M30 25V130H570" fill="none" stroke="currentColor" opacity="0.3" />
      <polyline points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {values.map((v, i) => <circle key={v.label} cx={points[i].x} cy={points[i].y} r="3" fill="currentColor"><title>{v.label}: {v.value}</title></circle>)}
    </svg>
    <div aria-hidden="true" className="flex justify-between gap-2 text-xs text-anthracite-300">{[0, Math.floor((values.length - 1) / 2), values.length - 1].filter((n,i,a) => a.indexOf(n) === i).map(n => <span key={n}>{values[n].label}</span>)}</div>
  </figure>;
}
