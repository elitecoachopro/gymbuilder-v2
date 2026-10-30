'use client';

import Link from 'next/link';
import { ArrowUpRight, Globe2, MapPin } from 'lucide-react';
import { markets } from '@/lib/markets';
import { useUiText } from '@/i18n/useUiText';

export default function MarketNavigation({ selected, directory = false, condition }: { selected?: string | null; directory?: boolean; condition?: string }) {
  const ui = useUiText();
  const path = directory ? '/suppliers' : '/products';
  const conditionQuery = !directory && (condition === 'used' || condition === 'new') ? `condition=${condition}` : '';
  return (
    <section id="markets" aria-label={ui('Piețe de echipamente')} className="scroll-mt-[calc(var(--app-header-height)+1rem)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-white">{ui('Alege piața de echipamente')}</h2>
        {selected && <Link href={conditionQuery ? `${path}?${conditionQuery}` : path} className="inline-flex min-h-11 items-center text-sm text-gold-400 hover:underline">{ui('Vezi toate piețele')}</Link>}
      </div>
      <nav aria-label={ui('Piețe de echipamente')} className="grid gap-4 md:grid-cols-3">
        {markets.map(market => (
          <Link key={market.slug} href={`${path}?market=${market.slug}${conditionQuery ? `&${conditionQuery}` : ''}`} aria-current={selected === market.slug ? 'page' : undefined}
            className={`group rounded-2xl border p-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 ${selected === market.slug ? 'border-gold-400 bg-gold-400/10' : 'border-anthracite-700 bg-anthracite-900 hover:border-gold-400/60'}`}>
            <div className="mb-4 flex items-center justify-between text-gold-400">
              {market.slug === 'romania' ? <MapPin aria-hidden="true" className="h-6 w-6" /> : <Globe2 aria-hidden="true" className="h-6 w-6" />}
              <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{ui(market.name)}</h3>
            <p className="text-sm leading-relaxed text-anthracite-300">{ui(market.description)}</p>
            <span className="mt-4 block text-sm font-semibold text-gold-400">{ui(directory ? 'Vezi furnizorii' : 'Vezi catalogul')}</span>
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-sm leading-relaxed text-anthracite-400">{ui('Secțiunile sunt grupate după țara furnizorului. Marca și țara de fabricație sunt informații distincte; confirmă originea echipamentului cu furnizorul.')}</p>
    </section>
  );
}
