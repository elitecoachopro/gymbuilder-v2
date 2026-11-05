'use client';

import { useMemo, useState } from 'react';
import { DEFAULT_VISUALIZATION } from '../../../../src/lib/gym-visualization';
import dynamic from 'next/dynamic';
import type { CameraCommand } from '../../../../src/components/studio/SpaceScene';
import { spaceSchema, spaceCost } from '../../../../src/lib/gym-space';
import SpacePlan from '../../../../src/components/studio/SpacePlan';
import { LocaleProvider } from '../../../../src/i18n/LocaleProvider';
import expanded from '../../../fixtures/gym-600m2-demonstration.json';
import original from '../../../../docs/audits/ai-requirements-flow-20261105/gymbuilder-ai-300m2.json';

const Scene = dynamic(() => import('../../../../src/components/studio/SpaceScene'), { ssr: false });
type Shot = { label: string; position: [number, number, number]; lookAt: [number, number, number]; overview?: boolean };
const expandedShots: Shot[] = [
  { label: 'Ansamblu · 600 m²', position: [34, 27, 33], lookAt: [15, 0, 10], overview: true },
  { label: 'Plan complet · vedere de sus', position: [15, 25, 10.01], lookAt: [15, 0, 10], overview: true },
  { label: 'Recepție · din interior', position: [1.2, 1.65, 17.6], lookAt: [4.3, 1, 16.3] },
  { label: 'Vestiar femei · dulapuri și bănci', position: [7, 1.65, 15.7], lookAt: [10.7, 1.05, 19.25] },
  { label: 'Vestiar bărbați · din interior', position: [14.8, 1.65, 15.7], lookAt: [18.5, 1.05, 19.25] },
  { label: 'Vestiare · detaliu dușuri', position: [10.7, 1.65, 18.2], lookAt: [12.7, 1.1, 18.3] },
  { label: 'Cardio · printre echipamente', position: [9.5, 1.65, 7.1], lookAt: [3.5, 1, 2.5] },
  { label: 'Forță · culoarul central', position: [19.1, 1.65, 9.6], lookAt: [20.4, 1.1, 3.8] },
  { label: 'Presă picioare · detaliu', position: [18.4, 1.65, 5.5], lookAt: [21.1, 0.9, 4] },
  { label: 'Cabluri · vedere apropiată', position: [26.5, 1.65, 5.2], lookAt: [28.5, 1.1, 3] },
  { label: 'Greutăți libere · rackuri și gantere', position: [9.6, 1.65, 12.5], lookAt: [3.2, 1, 10.6] },
  { label: 'Functional · vâslit și rig', position: [10.6, 1.65, 12.8], lookAt: [18.3, 1.1, 11.6] },
  { label: 'Studio · clase și stretching', position: [21, 1.65, 12.8], lookAt: [27.3, 0.6, 10.8] },
  { label: 'Refacere · saună și criosaună', position: [22.3, 1.65, 15.8], lookAt: [26.8, 1.1, 18.5] },
  { label: 'Saună · vedere apropiată', position: [24, 1.65, 16.3], lookAt: [24, 1.1, 18.4] },
  { label: 'Criosaună · model conceptual', position: [27.2, 1.65, 16.2], lookAt: [27.5, 1.1, 18.5] },
];
const originalShots: Shot[] = [
  { label: 'Ansamblu · 300 m²', position: [23, 18, 26], lookAt: [10, 0, 7.5], overview: true },
  { label: 'Plan complet · 300 m²', position: [10, 21, 7.51], lookAt: [10, 0, 7.5], overview: true },
  { label: 'Recepție · 300 m²', position: [3.2, 1.65, 3.8], lookAt: [0.7, 1.05, 1.5] },
  { label: 'Vestiar femei · 300 m²', position: [5.5, 1.65, 2.4], lookAt: [11.4, 1.05, 2.7] },
  { label: 'Vestiar bărbați · 300 m²', position: [13.5, 1.65, 2.4], lookAt: [19.4, 1.05, 2.7] },
  { label: 'Cardio · 300 m²', position: [5.6, 1.65, 12], lookAt: [2, 1.05, 6.8] },
  { label: 'Forță · 300 m²', position: [12, 1.65, 11.3], lookAt: [17, 1.1, 7] },
  { label: 'Presă picioare · 300 m²', position: [11.9, 1.65, 8.4], lookAt: [9.98, 0.95, 7.5] },
];

export default function ResultTour() {
  const [large, setLarge] = useState(true), [index, setIndex] = useState(0), [failure, setFailure] = useState(false);
  const [id, setId] = useState(1), [presentation, setPresentation] = useState(false);
  const source = large ? expanded : original;
  const space = useMemo(() => {
    const parsed = spaceSchema.parse(source.space);
    return { ...parsed, visualization: { ...DEFAULT_VISUALIZATION, ...parsed.visualization, fov: 60, dimensions: false } };
  }, [source]);
  const shots = large ? expandedShots : originalShots, shot = shots[index];
  const command: CameraCommand = { kind: 'pose', id, position: shot.position, lookAt: shot.lookAt };
  const choose = (next: number) => { setIndex(next); setId(value => value + 1); };
  return <LocaleProvider initialLocale="ro"><main className="min-h-screen bg-anthracite-900 p-4 text-white">
    <h1 className="text-xl font-semibold">Gym Builder · turul rezultatului final</h1>
    <p className="mt-2 text-sm text-anthracite-200">{large ? '600' : '300'} m² · {space.items.length} obiecte · buget {source.budget.toLocaleString('ro-RO')} EUR · dotări orientative {spaceCost(space).toLocaleString('ro-RO')} EUR</p>
    <div className="my-3 flex flex-wrap gap-2"><button className="min-h-12 rounded border px-4" aria-pressed={large} onClick={() => { setLarge(true); choose(0); }}>Concept extins · 600 m²</button><button className="min-h-12 rounded border px-4" aria-pressed={!large} onClick={() => { setLarge(false); choose(0); }}>Proiect anterior · 300 m²</button></div>
    <label className="block max-w-xl text-sm">Punct de vedere<select className="mt-1 min-h-12 w-full rounded border border-white/30 bg-anthracite-800 px-3" value={index} onChange={event => choose(Number(event.target.value))}>{shots.map((item, i) => <option key={item.label} value={i}>{i + 1}. {item.label}</option>)}</select></label>
    <h2 className="my-3 text-lg" aria-live="polite">{shot.label}</h2>
    <button className="mb-3 min-h-12 rounded border px-4" onClick={() => setPresentation(true)}>Cadru complet</button>
    <div className={presentation ? "fixed inset-0 z-50 bg-anthracite-900" : "h-[65vh] min-h-80 overflow-hidden rounded-xl border border-white/20"} aria-label="Rezultatul 3D al proiectului">
      {failure ? <div className="h-full"><p role="status">Grafica 3D s-a oprit. Proiectul rămâne vizibil în 2D.</p><SpacePlan space={space} selected={null} onSelect={() => {}} onMove={() => false} onEdit={() => null} height={source.height} budget={source.budget} disabled label="Planul complet al proiectului" /></div> : <Scene space={space} height={source.height} selected={null} view={shot.overview ? 'orbit' : 'inside'} cutaway={!!shot.overview} showAreas={false} onSelect={() => {}} onMove={() => false} onCaptureReady={() => {}} fallback="Scena nu poate fi afișată în 3D." profile="low" navigation="orbit" cameraCommand={command} onFailure={() => setFailure(true)} />}
      {presentation && <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 rounded bg-anthracite-900/90 p-2"><button className="min-h-12 rounded border px-4" onClick={() => choose((index + 1) % shots.length)}>Următorul cadru</button><button className="min-h-12 rounded border px-4" onClick={() => setPresentation(false)}>Închide cadrul complet</button><p className="flex items-center text-sm">{shot.label}</p></div>}
    </div>
    <div className="my-3 flex flex-wrap gap-2"><button className="min-h-12 rounded border px-4" onClick={() => choose((index + shots.length - 1) % shots.length)}>Unghiul anterior</button><button className="min-h-12 rounded border px-4" onClick={() => choose((index + 1) % shots.length)}>Unghiul următor</button></div>
    <p className="max-w-4xl text-sm text-anthracite-300">Demonstrație locală · profil economic · proiectul de 600 m² este un concept compus pentru această prezentare. Costuri orientative pentru dotări, fără TVA, amenajare, instalații, transport sau montaj. Sauna și criosauna sunt modele generice. Nu reprezintă un proiect tehnic autorizat.</p>
  </main></LocaleProvider>;
}
