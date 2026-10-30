'use client';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { useClientLocale } from '@/i18n/client';
import { useUiText } from '@/i18n/useUiText';
import { EQUIPMENT_CATALOG } from '@/lib/gym-catalog';
import { spaceCost } from '@/lib/gym-space';
import type { GymAiReview } from '@/lib/gym-ai-proposal';
import SpacePlan from './SpacePlan';

const button = 'min-h-11 rounded-lg border border-white/20 px-3 text-sm hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed';
export default function AiProposalReview({ review, current, graphicsFailed, height, onApply }: { review: GymAiReview; current: boolean; graphicsFailed: boolean; height: number; onApply: () => void }) {
  const locale = useClientLocale(), ui = useUiText();
  const t = (ro: string, en: string) => locale === 'en' ? en : ro;
  const [preview, setPreview] = useState(false), [selected, setSelected] = useState<string | null>(null);
  const proposal = review.proposal;
  const applyLabel = graphicsFailed ? t('Aplică în 2D', 'Apply in 2D') : t('Aplică și deschide în 3D', 'Apply and open in 3D');
  const changes = proposal && <div className="space-y-2 text-sm">
    <p className="font-medium">{review.source.storey === 0 ? t('Parter', 'Ground floor') : t('Etaj 1', 'First floor')} · {proposal.space.items.length} {t('obiecte propuse', 'proposed objects')}</p>
    <p>{t('Se înlocuiesc toate dotările acestui nivel:', 'All equipment on this floor will be replaced:')} {review.replacedCount} → {proposal.space.items.length}. {t('Celălalt nivel este păstrat.', 'The other floor is preserved.')}</p>
    <p>€{spaceCost(proposal.space).toLocaleString(locale)} / {review.budget === null ? t('fără plafon', 'no cap') : `€${review.budget.toLocaleString(locale)}`} {t('disponibil pentru acest nivel', 'available for this floor')}</p>
    <details><summary className="cursor-pointer min-h-11 py-2 text-gold-200">{t('Dotări existente → propuse', 'Existing → proposed equipment')}</summary><ul className="space-y-1">{review.changes.map(change => <li key={change.templateId}>{ui(EQUIPMENT_CATALOG.find(model => model.id === change.templateId)?.name)}: {change.before} → {change.after}</li>)}</ul></details>
    <p className="text-xs text-anthracite-300">{proposal.zoning === 'generated' ? t('Compartimentare nouă, cu culoar de 1,2 m. Verifică accesul și dimensiunile înainte de execuție.', 'New partitions with a 1.2 m corridor. Review access and dimensions before construction.') : t('Pereții, deschiderile, stâlpii și scara existente sunt păstrate.', 'Existing walls, openings, columns and stairs are preserved.')}</p>
    {proposal.omitted.map((item, index) => <p key={index} className="text-xs text-amber-200">{item.quantity} × {ui(EQUIPMENT_CATALOG.find(model => model.id === item.templateId)?.name)} — {item.reason === 'space' ? t('spațiu insuficient', 'insufficient space') : item.reason === 'budget' ? t('buget insuficient', 'insufficient budget') : t('înălțime insuficientă', 'insufficient height')}</p>)}
  </div>;
  const stale = !current && <p className="text-amber-200 text-sm">{t('Proiectul s-a schimbat. Generează din nou.', 'The project changed. Generate again.')}</p>;
  return <section className="p-3 rounded-lg border border-gold-400/30 space-y-3 text-sm" aria-label={t('Propunerea ta AI', 'Your AI proposal')}>
    <h3 className="font-semibold text-gold-200">{t('Propunerea ta AI', 'Your AI proposal')}</h3>
    {changes}
    {proposal && <button className={`${button} w-full`} onClick={() => setPreview(true)}>{t('Previzualizează planul 2D', 'Preview the 2D plan')}</button>}
    <details><summary className="cursor-pointer min-h-11 py-2 text-gold-200">{t('Explicația AI și ipotezele de proiectare', 'AI explanation and design assumptions')}</summary><p className="whitespace-pre-wrap">{review.design.summary}</p></details>
    {review.design.questions.map((question, index) => <p key={index} className="text-amber-200">{question}</p>)}
    {!proposal && <p className="text-amber-200">{t('Sunt necesare clarificări sau măsurători complete. Completează cerințele și generează din nou. Proiectul este păstrat.', 'Clarifications or complete measurements are needed. Update your requirements and generate again. Your project is preserved.')}</p>}
    {stale}
    {preview && proposal && <Modal label={t('Previzualizare propunere AI', 'AI proposal preview')} onClose={() => setPreview(false)}><section className="w-full rounded-xl border border-white/15 bg-anthracite-800 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3"><h2 className="font-semibold">{t('Previzualizare 2D — proiectul este neschimbat', '2D preview — your project is unchanged')}</h2><button className={button} onClick={() => setPreview(false)}>{t('Închide', 'Close')}</button></div>
      <div className="h-[520px] sm:h-[420px]"><SpacePlan space={proposal.space} height={height} budget={review.budget} disabled selected={selected} onSelect={setSelected} onMove={() => false} onEdit={() => null} label={t('Plan AI propus, doar pentru vizualizare', 'Proposed AI plan, read only')} /></div>
      {changes}{stale}
      <p className="text-xs text-anthracite-300">{t('Aplicarea poate fi anulată cu Undo. Salvarea în cont rămâne o acțiune separată.', 'Applying can be undone with Undo. Saving to your account remains a separate action.')}</p>
      <button className={`${button} w-full border-gold-400 text-gold-200`} disabled={!current} onClick={onApply}>{applyLabel}</button>
    </section></Modal>}
  </section>;
}
