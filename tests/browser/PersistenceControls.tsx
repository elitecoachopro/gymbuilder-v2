'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { _roots } from '@react-three/fiber';
import { latestEditorDraft } from '../../src/lib/gym-editor-draft';
import { useAuthStore } from '../../src/store/auth';

export default function PersistenceControls({ report }: { report: (message: string) => void }) {
  const restore = useRef<(() => void) | null>(null), cancelTour = useRef<(() => void) | null>(null);
  useEffect(() => () => { restore.current?.(); cancelTour.current?.(); }, []);
  const config = async (body: object) => { await fetch('/api/persistence-fixture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); report('Configurație de test actualizată.'); };
  const webgl = (mode: 'none' | 'throw' | 'restore') => {
    restore.current?.(); restore.current = null;
    if (mode === 'restore') { report('WebGL restaurat. Reîncearcă 3D explicit.'); return; }
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl') || args[0] === 'experimental-webgl') {
        if (mode === 'throw') throw new Error('U6 fixture renderer creation error');
        return null;
      }
      return original.apply(this, args);
    } as typeof original;
    restore.current = () => { HTMLCanvasElement.prototype.getContext = original; };
    report(mode === 'none' ? 'WebGL indisponibil pentru următoarea creare de canvas.' : 'Eroare de creare renderer armată.');
  };
  const failDraft = () => {
    restore.current?.();
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<typeof original>) {
      if (this.transaction.db.name === 'gymbuilder-editor') throw new DOMException('U6 fixture quota failure', 'QuotaExceededError');
      return original.apply(this, args);
    };
    restore.current = () => { IDBObjectStore.prototype.put = original; };
    report('Eșec la scrierea următoarei ciorne. Datele deja scrise rămân în IndexedDB.');
  };
  const inspect = async () => {
    const owner = useAuthStore.getState().user?.id ?? 'guest';
    const draft = await latestEditorDraft(owner);
    const response = await fetch('/api/gym-projects').then(response => response.json());
    const saved = response.projects?.find((project: { id: string }) => project.id === new URLSearchParams(location.search).get('id'));
    const configuration = saved?.configuration;
    const summarize = (space: typeof draft extends null ? never : NonNullable<typeof draft>['document']['space'] | undefined) => space && ({ ground: space.items, upper: space.upperFloor?.items, finishes: space.finishes, upperFinishes: space.upperFloor?.finishes, visualization: space.visualization, upperVisualization: space.upperFloor?.visualization, columns: space.columns, stairwell: space.stairwell });
    report(JSON.stringify({ owner, saves: response.saves, draftStorey: draft?.storey, draftName: draft?.document.name, savedName: saved?.name, draft: summarize(draft?.document.space), saved: summarize(configuration?.space), budget: draft?.document.budget ?? configuration?.budget_eur }));
  };
  const tour = (duration: number, moving: boolean) => {
    cancelTour.current?.();
    const canvas = document.querySelector('canvas'), state = canvas ? _roots.get(canvas)?.store.getState() : undefined;
    if (!state) { report('Deschide mai întâi scena 3D.'); return; }
    const start = performance.now(), original = state.gl.render, frameTimes: number[] = [];
    let frame = 0, previous = start, frames = 0;
    state.gl.render = function (...args) { const now = performance.now(); frameTimes.push(now - previous); previous = now; frames++; return original.apply(this, args); };
    const initial = state.camera.position.clone(), centre = state.controls && 'target' in state.controls ? (state.controls as THREE.EventDispatcher & { target: THREE.Vector3 }).target.clone() : new THREE.Vector3(10, 0, 7.5);
    const cleanup = () => { cancelAnimationFrame(frame); state.gl.render = original; cancelTour.current = null; };
    cancelTour.current = cleanup;
    const tick = () => {
      const elapsed = performance.now() - start;
      if (elapsed >= duration) {
        cleanup(); const sorted = frameTimes.slice(1).sort((a,b)=>a-b);
        report(JSON.stringify({ kind: moving ? 'tour' : 'idle', elapsedMs: Math.round(elapsed), frames, medianFrameMs: sorted[Math.floor(sorted.length/2)] ?? null, dpr: state.gl.getPixelRatio(), shadows: state.gl.shadowMap.enabled, userAgent: navigator.userAgent, viewport: [innerWidth,innerHeight] })); return;
      }
      if (moving) { state.camera.position.copy(initial).sub(centre).applyAxisAngle(new THREE.Vector3(0,1,0), elapsed / duration * Math.PI * 2).add(centre); state.camera.lookAt(centre); state.invalidate(); }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); report(moving ? 'Tur economic de 60 secunde în curs.' : 'Observare idle de 5 secunde în curs.');
  };
  const buttons: [string, () => void][] = [
    ['Salvare eșuată 500', () => void config({ failure: 500 })], ['Salvare refuzată 404', () => void config({ failure: 404 })],
    ['Expiră sesiunea serverului', () => void config({ owner: 'expired' })], ['Restaurează sesiunea A', () => void config({ owner: 'fixture-a', failure: 0, delay: 0 })],
    ['Întârzie salvarea', () => void config({ delay: 3000 })], ['Inspectează persistența U6', () => void inspect()],
    ['Dezactivează WebGL', () => webgl('none')], ['Eroare creare renderer', () => webgl('throw')], ['Restaurează grafica și stocarea', () => webgl('restore')],
    ['Eroare scriere ciornă', failDraft], ['Tur economic 60 secunde', () => tour(60000,true)], ['Măsoară idle 5 secunde', () => tour(5000,false)],
  ];
  return <div className="flex flex-wrap gap-2">{buttons.map(([label, action]) => <button className="min-h-11 border border-amber-400/30 px-3" key={label} onClick={action}>{label}</button>)}</div>;
}
