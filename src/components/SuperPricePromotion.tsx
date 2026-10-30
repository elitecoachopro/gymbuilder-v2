'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Mail, Zap } from 'lucide-react';
import { useClientLocale } from '@/i18n/client';
import { SUPER_PRICE_FEE_EUR, SUPER_PRICE_HOURS } from '@/lib/promotions';

export default function SuperPricePromotion({ onRequest }: { onRequest?: () => void }) {
  const en = useClientLocale() === 'en';
  const action = en ? 'Request Super price promotion' : 'Solicită promovarea Super preț';
  const buttonClass = 'mt-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-gold-400 px-5 py-3 text-sm font-semibold text-anthracite-950 hover:bg-gold-300';
  return <div className="flex h-full flex-col rounded-2xl border border-gold-400/40 bg-gradient-to-br from-gold-400/10 to-anthracite-900 p-6">
    <div className="mb-3 flex items-center gap-2 text-gold-400"><Zap className="h-5 w-5" aria-hidden="true" /><span className="text-xs font-semibold uppercase">{en ? 'Paid promotion' : 'Promovare plătită'}</span></div>
    <h3 className="text-xl font-bold text-white">{en ? 'Super price' : 'Super preț'}</h3>
    <p className="mt-2 text-sm text-anthracite-300">{en ? `Highlight a new or used product for ${SUPER_PRICE_HOURS} hours.` : `Pune în prim-plan un produs nou sau second-hand timp de ${SUPER_PRICE_HOURS} ore.`}</p>
    <p className="my-5"><strong className="text-3xl text-gold-400">{SUPER_PRICE_FEE_EUR} €</strong><span className="ml-2 text-sm text-anthracite-300">/ {SUPER_PRICE_HOURS} {en ? 'hours' : 'ore'}</span></p>
    <ul className="mb-5 space-y-2 text-sm text-anthracite-200">{(en ? ['Dedicated Super price section', 'Visible countdown below the offer', 'Direct link to your product and contact information'] : ['Secțiune dedicată Super preț', 'Cronometru vizibil sub ofertă', 'Link direct către produs și datele de contact']).map(text => <li key={text} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />{text}</li>)}</ul>
    {onRequest ? <button onClick={onRequest} className={buttonClass}>{action}</button> : <Link href="/supplier/dashboard#promotions" className={buttonClass}>{action}</Link>}
    <p className="mt-3 text-xs text-anthracite-400">{en ? 'Separate promotion fee. Payment and activation are confirmed with Gym Builder. The product remains in the catalog after the promotion ends.' : 'Taxă de promovare separată. Plata și activarea se confirmă cu Gym Builder. Produsul rămâne în catalog după expirarea promovării.'}</p>
  </div>;
}

export function SuperPriceRequest() {
  const en = useClientLocale() === 'en';
  const [products, setProducts] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [selected, setSelected] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/supplier/products', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Products unavailable');
      const data = await response.json();
      if (controller.signal.aborted) return;
      setProducts(data.products.filter((p: { status: string }) => ['active', 'featured'].includes(p.status)));
      setState('ready');
    }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, []);
  const product = products.find(p => p.id === selected);
  const subject = en ? 'Super price promotion request' : 'Solicitare promovare Super preț';
  const body = `${en ? `I request Super price promotion: ${SUPER_PRICE_FEE_EUR} EUR for ${SUPER_PRICE_HOURS} hours. Please confirm the period and payment before activation.` : `Doresc promovarea Super preț: ${SUPER_PRICE_FEE_EUR} EUR pentru ${SUPER_PRICE_HOURS} ore. Vă rog să confirmați perioada și plata înainte de activare.`}\n\n${product?.name ?? ''}\nhttps://www.gymbuilder.app/products/${product?.id ?? ''}`;
  return <div className="space-y-3">
    <label className="block text-sm text-anthracite-200">{en ? 'Product to promote' : 'Produsul de promovat'}
      <select value={selected} onChange={event => setSelected(event.target.value)} disabled={state !== 'ready'} className="mt-2 min-h-11 w-full rounded-lg border border-anthracite-600 bg-anthracite-800 px-3 py-2 text-white">
        <option value="">{en ? 'Choose a published product' : 'Alege un produs publicat'}</option>
        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
    {state === 'loading' && <p role="status" className="text-sm text-anthracite-300">{en ? 'Loading your products…' : 'Se încarcă produsele tale…'}</p>}
    {state === 'error' && <p role="alert" className="text-sm text-red-300">{en ? 'Products could not be loaded. Close and reopen the request to retry.' : 'Produsele nu au putut fi încărcate. Închide și redeschide solicitarea pentru a reîncerca.'}</p>}
    {state === 'ready' && !products.length && <p className="text-sm text-anthracite-300">{en ? 'Publish a product before requesting promotion.' : 'Publică un produs înainte de a solicita promovarea.'} <Link href="/supplier/products" className="text-gold-400 underline">{en ? 'My products' : 'Produsele mele'}</Link></p>}
    {product ? <a href={`mailto:contact@gymbuilder.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-3 text-sm font-semibold text-anthracite-950"><Mail className="h-5 w-5" aria-hidden="true" />{en ? 'Send request by email' : 'Trimite solicitarea prin email'}</a> : <button disabled className="min-h-11 w-full rounded-xl bg-anthracite-800 px-4 py-3 text-sm text-anthracite-400">{en ? 'Choose a product to continue' : 'Alege un produs pentru a continua'}</button>}
  </div>;
}
