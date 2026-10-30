'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUiText } from '@/i18n/useUiText';
export default function MyGymProjects() {
  const ui = useUiText();
  const [projects, setProjects] = useState<{ id: string; name: string; configuration?: { space?: unknown } | null }[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setState('loading');
    fetch('/api/gym-projects', { signal: controller.signal }).then(async r => { if (!r.ok) throw new Error(); return r.json(); }).then(v => { if (!controller.signal.aborted) { setProjects(v.projects || []); setState('ready'); } }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [retry]);
  return <section id="proiecte" className="mb-8 rounded-xl border border-anthracite-700 p-5 scroll-mt-40">
    <h2 className="text-xl font-bold mb-4">{ui('Proiectele mele')}</h2><Link href="/configurator" className="btn-primary inline-flex mb-4">{ui('Creează un proiect')}</Link>
    {state === 'loading' && <p role="status">{ui('Se încarcă proiectele…')}</p>}
    {state === 'error' && <div role="alert"><p>{ui('Proiectele salvate nu au putut fi încărcate.')}</p><button className="btn-secondary" onClick={() => setRetry(n => n + 1)}>{ui('Reîncearcă')}</button></div>}
    {state === 'ready' && (projects.length ? <ul className="grid gap-3 sm:grid-cols-2">{projects.map(p => <li key={p.id}><Link className="min-h-11 flex items-center rounded-lg border border-anthracite-600 p-3 text-gold-400" href={`${p.configuration?.space ? '/configurator' : '/configurator/classic'}?id=${encodeURIComponent(p.id)}`}>{p.name}</Link></li>)}</ul> : <p>{ui('Nu ai proiecte salvate în cont. Poți începe un proiect nou sau recupera ciorna locală din configurator.')}</p>)}
  </section>;
}
