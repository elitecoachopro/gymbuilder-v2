'use client';
import { useState } from 'react';
import type { GymSpace } from '@/lib/gym-space';
import type { StructureCommand } from '@/lib/gym-space-edit';
import { DEFAULT_VISUALIZATION } from '@/lib/gym-visualization';

type Props = { space: GymSpace; selected: string; disabled: boolean; onEdit: (command: StructureCommand) => string | null; onClose: () => void; t: (ro: string, en: string) => string };
const field = 'w-full min-h-11 rounded-lg border border-white/20 bg-anthracite-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-gold-400';
const button = 'min-h-11 min-w-11 rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400';

export default function StructureInspector({ space, selected, disabled, onEdit, onClose, t }: Props) {
  const wall = space.walls.find(w => w.id === selected), opening = space.openings.find(o => o.id === selected);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(wall ? { x: wall.x, y: wall.y, length: wall.length, thickness: wall.thickness } : opening ? { offset: opening.offset, width: opening.width, height: opening.height, sill: opening.sill } : {}).map(([key, value]) => [key, String(value)])));
  const [error, setError] = useState<string | null>(null);
  if (!wall && !opening) return null;
  const labels: Record<string, string> = { x: 'X (m)', y: 'Y (m)', length: t('Lungimea peretelui (m)', 'Wall length (m)'), thickness: t('Grosimea peretelui (m)', 'Wall thickness (m)'), offset: t('Distanță de la început (m)', 'Offset from start (m)'), width: t('Lățimea deschiderii (m)', 'Opening width (m)'), height: t('Înălțimea deschiderii (m)', 'Opening height (m)'), sill: t('Parapet (m)', 'Sill height (m)') };
  const apply = () => {
    if (Object.values(values).some(v => !v.trim() || !Number.isFinite(Number(v)))) { setError(t('Completează toate valorile numerice.', 'Complete every numeric value.')); return; }
    const patch = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
    setError(onEdit(wall ? { kind: 'wall', id: selected, patch } : { kind: 'opening', id: selected, patch }));
  };
  return <form aria-label={t('Editare perete sau deschidere', 'Edit wall or opening')} onSubmit={e => { e.preventDefault(); apply(); }} className="rounded-xl border border-gold-400/40 bg-anthracite-800 p-4 space-y-3">
    <div className="flex justify-between items-center gap-3"><h2 className="font-medium">{wall ? t('Perete interior selectat', 'Selected partition wall') : opening?.kind === 'door' ? t('Ușă selectată', 'Selected door') : t('Fereastră selectată', 'Selected window')}</h2><button type="button" className={button} onClick={onClose}>{t('Închide', 'Close')}</button></div>
    <p className="text-xs text-anthracite-300">{t('Poziția, lungimea și lățimea folosesc pasul de aliniere:', 'Position, length and width use the snap step:')} {space.visualization?.snap ?? DEFAULT_VISUALIZATION.snap} m. {wall ? t('Deschiderile rămân atașate acestui perete.', 'Openings stay attached to this wall.') : t('Distanța pornește de la capătul cu X/Y minim.', 'Offset starts at the minimum X/Y end.')}</p>
    <fieldset disabled={disabled} className="grid grid-cols-2 gap-3 disabled:opacity-50">{Object.entries(values).filter(([key]) => key !== 'sill' || opening?.kind === 'window').map(([key, value]) => <label key={key} className="block text-xs text-anthracite-200"><span className="block mb-1.5">{labels[key]}</span><input className={field} type="number" step="0.01" value={value} onChange={e => { setValues(v => ({ ...v, [key]: e.target.value })); setError(null); }} /></label>)}</fieldset>
    {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" className={button} disabled={disabled}>{t('Aplică modificarea', 'Apply change')}</button><button type="button" className={`${button} text-red-200`} disabled={disabled} onClick={() => { const problem = onEdit({ kind: wall ? 'delete-wall' : 'delete-opening', id: selected }); setError(problem); if (!problem) onClose(); }}>{wall ? t('Elimină peretele și deschiderile sale', 'Remove wall and its openings') : t('Elimină deschiderea', 'Remove opening')}</button></div>
  </form>;
}
