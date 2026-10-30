'use client';

import { useUiText } from '@/i18n/useUiText';

export default function BuyingGuide() {
  const ui = useUiText();
  const steps = [
    ['Alege echipamentul', 'Compară fotografiile, specificațiile, starea și prețurile publicate de furnizori.'],
    ['Contactează direct furnizorul', 'Confirmă disponibilitatea, țara de fabricație, prețul final, moneda și modalitatea de plată.'],
    ['Stabilește livrarea și suportul', 'Discută transportul până la adresa ta, eventualele formalități și costuri de import, instalarea, garanția și service-ul.'],
  ];
  return (
    <section aria-label={ui('Cum cumperi echipamente')} className="rounded-2xl border border-anthracite-700 bg-anthracite-900 p-5 sm:p-7">
      <h2 className="mb-3 text-2xl font-bold text-white">{ui('Cum cumperi echipamente')}</h2>
      <p className="mb-6 text-sm leading-relaxed text-anthracite-300">{ui('Gym Builder publică echipamente și date de contact. Achiziția se stabilește direct între client și furnizor; Gym Builder nu încasează plăți și nu gestionează comenzi, transport sau vamă.')}</p>
      <ol className="grid gap-6 md:grid-cols-3">
        {steps.map(([title, description], index) => <li key={title}><span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-400/10 font-bold text-gold-400" aria-hidden="true">{index + 1}</span><h3 className="mb-2 font-semibold text-white">{ui(title)}</h3><p className="text-sm leading-relaxed text-anthracite-300">{ui(description)}</p></li>)}
      </ol>
    </section>
  );
}
