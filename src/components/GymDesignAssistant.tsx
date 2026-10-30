'use client';
import AiDataConsent from '@/components/AiDataConsent';

import { useEffect, useState } from 'react';
import { Sparkles, Wand2, Check, Loader2, Ruler, Wallet, AlertTriangle } from 'lucide-react';
import { useUiText } from '@/i18n/useUiText';
import { useClientLocale } from '@/i18n/client';
import { EQUIPMENT_CATALOG, ZONE_DEFINITIONS } from '@/lib/gym-catalog';
import { studioConfigurationSchema, buildGymProposal, type GymBrief, type GymProposal, type StudioConfiguration } from '@/lib/gym-studio';
import type { AiDesign } from '@/lib/gym-ai';

export type StudioDraft = StudioConfiguration & { length_m: number | null; width_m: number | null; total_area: number | null };
export interface ReviewedGymDesign { brief: GymBrief; proposal: GymProposal }
interface Props {
  draft: StudioDraft; onChange: (configuration: StudioConfiguration) => void;
  onApply: (design: ReviewedGymDesign) => void;
}
const errorCopy: Record<string, string> = {
  AUTH_REQUIRED: 'Autentifică-te pentru a folosi asistentul AI.', AI_NOT_CONFIGURED: 'AI-ul nu este configurat încă. Generatorul standard este disponibil.',
  INVALID_BRIEF: 'Completează cerințele și verifică dimensiunile.', AI_UNAVAILABLE: 'Serviciul AI nu este disponibil momentan. Încearcă din nou.',
  AI_INVALID_RESPONSE: 'AI-ul nu a returnat un plan valid. Clarifică dimensiunile și încearcă din nou.',
};
export default function GymDesignAssistant({ draft, onChange, onApply }: Props) {
  const ui = useUiText(), locale = useClientLocale();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [capabilityFailed, setCapabilityFailed] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [review, setReview] = useState<{ design: ReviewedGymDesign | null; ai: AiDesign | null; source: string; fingerprint: string } | null>(null);
  const fingerprint = JSON.stringify(draft);
  const stale = review && review.fingerprint !== fingerprint;
  const checkCapability = () => {
    setCapabilityFailed(false); setConfigured(null);
    fetch('/api/configurator/ai', { signal: AbortSignal.timeout(8000), cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => setConfigured(data.configured === true)).catch(() => setCapabilityFailed(true));
  };
  useEffect(() => { checkCapability(); }, []);
  const change = (value: Partial<StudioConfiguration>) => { onChange({ version: 1, height_m: draft.height_m, budget_eur: draft.budget_eur, brief: draft.brief, zone_ids: draft.zone_ids, profile: draft.profile, ...value }); };
  const generateStandard = () => {
    setError('');
    try {
      const { length_m: _length, width_m: _width, total_area: _area, ...configuration } = draft;
      if (!studioConfigurationSchema.safeParse(configuration).success || !draft.length_m || !draft.width_m || !draft.total_area) throw new Error('Completează cerințele și verifică dimensiunile.');
      const brief: GymBrief = { ...draft, length_m: draft.length_m, width_m: draft.width_m, total_area: draft.total_area };
      setReview({ design: { brief, proposal: buildGymProposal(brief) }, ai: null, source: 'Propunere standard', fingerprint });
    } catch (e) { setError(e instanceof Error ? e.message : 'Completează cerințele și verifică dimensiunile.'); }
  };
  const [aiConsent, setAiConsent] = useState(false);
  const generateAi = async () => {
    if (!aiConsent) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/configurator/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aiConsent: true,
        brief: draft.brief, locale, context: { length_m: draft.length_m, width_m: draft.width_m, total_area: draft.total_area, height_m: draft.height_m, budget_eur: draft.budget_eur, zone_ids: draft.zone_ids, profile: draft.profile },
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(errorCopy[data.error] || (response.status === 429 ? 'Limita de cereri AI a fost atinsă. Încearcă mai târziu.' : 'Serviciul AI nu este disponibil momentan. Încearcă din nou.'));
      const ai = data.design as AiDesign;
      const brief = data.proposal ? { ...draft, length_m: ai.length_m!, width_m: ai.width_m!, total_area: ai.total_area!, height_m: ai.height_m!, budget_eur: ai.budget_eur, profile: ai.profile, zone_ids: ai.zones.map(z => z.zoneId) } : null;
      setReview({ design: brief ? { brief, proposal: data.proposal } : null, ai, source: 'Propunere AI', fingerprint });
    } catch (e) { setError(e instanceof Error && [...Object.values(errorCopy), 'Limita de cereri AI a fost atinsă. Încearcă mai târziu.'].includes(e.message) ? e.message : errorCopy.AI_UNAVAILABLE); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-gold-400/25 bg-anthracite-900 p-4 sm:p-6 space-y-5" aria-label={ui('Cerințe și asistent AI')}>
    <header className="flex gap-3"><div className="p-2 h-fit rounded-xl bg-gold-400/10"><Sparkles className="text-gold-400 w-5 h-5" /></div><div><h2 className="text-lg font-semibold text-white">{ui('De la cerințe la plan 3D')}</h2><p className="text-sm text-anthracite-300">{ui('Definește spațiul, alege zonele și verifică propunerea înainte să o aplici.')}</p></div></header>
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="block text-sm text-anthracite-200"><span className="flex items-center gap-2 mb-2"><Ruler className="w-4 h-4" />{ui('Înălțime liberă (m)')}</span><input className="input-field" type="number" min="2" max="30" step="0.01" value={Number.isFinite(draft.height_m) ? draft.height_m : ''} onChange={e => change({ height_m: e.target.value === '' ? NaN : Number(e.target.value) })} /></label>
      <label className="block text-sm text-anthracite-200"><span className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4" />{ui('Buget dotări (EUR)')}</span><input className="input-field" type="number" min="1" max="99999999" step="100" placeholder={ui('Fără plafon')} value={draft.budget_eur ?? ''} onChange={e => change({ budget_eur: e.target.value ? Number(e.target.value) : null })} /></label>
      <label className="block text-sm text-anthracite-200"><span className="block mb-2">{ui('Profilul sălii')}</span><select className="input-field" value={draft.profile} onChange={e => change({ profile: e.target.value as StudioConfiguration['profile'] })}><option value="balanced">{ui('Fitness echilibrat')}</option><option value="strength">{ui('Forță și antrenament funcțional')}</option><option value="boutique">{ui('Studio boutique')}</option></select></label>
    </div>
    <fieldset><legend className="text-sm font-medium mb-2 text-white">{ui('Zone și utilități necesare')}</legend><div className="flex flex-wrap gap-2">{ZONE_DEFINITIONS.map(z => <label key={z.id} className={`flex items-center min-h-11 gap-2 rounded-lg px-3 py-2 border text-sm cursor-pointer ${draft.zone_ids.includes(z.id) ? 'border-gold-400/50 bg-gold-400/10 text-white' : 'border-anthracite-600 text-anthracite-300'}`}><input type="checkbox" className="accent-gold-400" checked={draft.zone_ids.includes(z.id)} onChange={e => change({ zone_ids: e.target.checked ? [...draft.zone_ids, z.id] : draft.zone_ids.filter(id => id !== z.id) })} />{ui(z.name)}</label>)}</div></fieldset>
    <label className="block text-sm font-medium text-white"><span className="block mb-2">{ui('Descrie sala pe care vrei să o deschizi')}</span><textarea className="input-field min-h-28 resize-y" maxLength={6000} value={draft.brief} onChange={e => change({ brief: e.target.value })} placeholder={ui('Exemplu: spațiu de 300 m², 20 × 15 m, înălțime 3,5 m, buget 30.000 EUR. Vreau recepție, vestiare cu dușuri, cardio și greutăți libere.')} /><span className="text-xs text-anthracite-400 font-normal">{ui('AI-ul primește cerințele și dimensiunile doar când apeși butonul AI.')}</span></label>
    <AiDataConsent checked={aiConsent} onChange={setAiConsent} />
    <div className="flex flex-wrap gap-3"><button className="btn-secondary min-h-11 flex items-center gap-2" disabled={busy || !draft.zone_ids.length} onClick={generateStandard}><Wand2 className="w-4 h-4" />{ui('Generează propunere standard')}</button><button className="btn-primary min-h-11 flex items-center gap-2 disabled:opacity-50" disabled={!aiConsent || busy || configured !== true || draft.brief.trim().length < 10} onClick={generateAi}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{ui(busy ? 'AI-ul pregătește propunerea...' : 'Generează cu AI')}</button></div>
    {capabilityFailed && <div className="text-sm text-amber-200"><p>{ui('Starea AI nu a putut fi verificată.')}</p><button className="btn-secondary min-h-11 mt-2" onClick={checkCapability}>{ui('Reverifică disponibilitatea AI')}</button></div>}
    {configured === false && <p className="text-sm text-amber-200">{ui('AI-ul nu este configurat încă. Generatorul standard este disponibil.')}</p>}
    <p className="text-xs text-anthracite-400">{ui('Propunerile generate pentru spații dreptunghiulare rezervă 15% pentru circulație. Distanțele sunt orientative; modificările manuale pot schimba rezerva. Instalațiile necesită proiectare de specialitate.')}</p>
    {error && <p role="alert" className="text-sm text-red-300">{ui(error)}</p>}
    {review && <div className="rounded-xl border border-anthracite-600 bg-anthracite-800 p-4 space-y-4" aria-live="polite">
      <h3 className="font-semibold text-gold-300">{ui(review.source)}</h3>
      {review.ai && <><p className="text-sm whitespace-pre-wrap text-anthracite-200">{review.ai.summary}</p>{review.ai.questions.length > 0 && <div className="text-sm text-amber-200"><p className="font-medium">{ui('De clarificat')}</p><ul className="list-disc pl-5 mt-2">{review.ai.questions.map((q, i) => <li key={i}>{q}</li>)}</ul><p className="mt-2">{ui('Adaugă răspunsurile în cerințe și generează din nou.')}</p></div>}</>}
      {review.design && <>
        <div className="grid sm:grid-cols-3 gap-3 text-sm text-white"><p>{review.design.brief.length_m} × {review.design.brief.width_m} × {review.design.brief.height_m} m<br /><span className="text-anthracite-400">{review.design.brief.total_area} m²</span></p><p>{review.design.proposal.equipment.length} {ui('machete standard')}<br /><span className="text-anthracite-400">{review.design.proposal.zones.length} {ui('zone')} · {review.design.proposal.circulation_m2.toFixed(1)} m² {ui('circulație')}</span></p><p>€{review.design.proposal.cost_eur.toLocaleString(locale)}<br /><span className="text-anthracite-400">{ui('Cost estimativ dotări')}</span></p></div>
        <details className="text-sm text-anthracite-200"><summary className="cursor-pointer min-h-11 py-2">{ui('Verifică zonele și machetele')}</summary><ul className="space-y-2">{review.design.proposal.zones.map(z => <li key={z.id}><strong>{ui(z.name)}</strong> · {z.area_m2.toFixed(1)} m²: {review.design!.proposal.equipment.filter(e => e.zoneId === z.id).map(e => ui(e.name)).join(', ') || ui('Fără echipamente')}</li>)}</ul></details>
        {review.design.proposal.unplaced.length > 0 && <div className="text-sm text-amber-200"><p className="flex items-center gap-2 font-medium"><AlertTriangle className="w-4 h-4" />{ui('Elemente neamplasate')}</p><ul className="list-disc pl-5 mt-2">{review.design.proposal.unplaced.map(item => <li key={`${item.templateId}-${item.reason}`}>{item.quantity} × {ui(EQUIPMENT_CATALOG.find(t => t.id === item.templateId)?.name)} — {ui(item.reason === 'height' ? 'înălțime insuficientă' : item.reason === 'budget' ? 'buget insuficient' : 'spațiu insuficient')}</li>)}</ul></div>}
        <p className="text-xs text-anthracite-300">{ui('Aplicarea înlocuiește planul curent. Poți reveni la planul anterior înainte de a salva.')}</p>
        <button className="btn-primary min-h-11 flex items-center gap-2 disabled:opacity-50" disabled={Boolean(stale) || busy || Boolean(review.ai?.questions.length)} onClick={() => { onApply(review.design!); setReview(null); }}><Check className="w-4 h-4" />{ui('Aplică în configuratorul 3D')}</button>
      </>}
      {stale && <p className="text-sm text-amber-200">{ui('Cerințele s-au schimbat. Generează din nou propunerea.')}</p>}
    </div>}
  </section>;
}
