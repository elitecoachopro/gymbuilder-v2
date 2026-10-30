'use client';
import { useEffect, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { _roots } from '@react-three/fiber';
import { useAuthStore } from '../../../src/store/auth';
import { emptySpace } from '../../../src/lib/gym-space';
import { clearEditorDrafts, latestEditorDraft } from '../../../src/lib/gym-editor-draft';
import { armGestureCheck, checkSelectTouch } from '../gesture-check';
import { LocaleProvider } from '../../../src/i18n/LocaleProvider';
import PersistenceControls from '../PersistenceControls';
import StudioWorkbench from '../../../src/components/studio/StudioWorkbench';

export default function BrowserCheck() {
  const aiBaseline = useRef<string | null>(null);
  const seedAi = async () => {
    const space = emptySpace();
    space.columns = [{ id: 'current-column', x: 8, y: 6, w: 1, d: 1 }];
    space.stairwell = { x: 16, y: 10, w: 2, d: 3, opening: false };
    space.items = [{ id: 'old-bike', templateId: 'bicicleta_spinning', x: 4, y: 4, rotation: 90 }];
    space.upperFloor = emptySpace(10, 10);
    space.upperFloor.items = [{ id: 'upper-treadmill', templateId: 'banda_alergare', x: 5, y: 5, rotation: 0 }];
    const response = await fetch('/api/gym-projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Imperial Gym · AI U5', configuration: { version: 1, height_m: 3.5, budget_eur: 10000, brief: 'Două benzi de alergare pentru nivelul activ.', zone_ids: ['cardio'], profile: 'balanced', space } }) });
    const { project } = await response.json();
    window.location.href = `/?id=${project.id}`;
  };
  const inspectAiDraft = async (capture: boolean) => {
    const draft = await latestEditorDraft(useAuthStore.getState().user?.id ?? 'guest');
    const document = draft?.document;
    if (!document) { setResult('Ciorna de test nu este încă disponibilă. Fă o modificare și așteaptă confirmarea locală.'); return; }
    const fingerprint = JSON.stringify(document);
    if (capture) aiBaseline.current = fingerprint;
    setResult(JSON.stringify({ baselineEqual: fingerprint === aiBaseline.current, ground: document.space.items, upper: document.space.upperFloor?.items, columns: document.space.columns, stairs: document.space.stairwell, budget: document.budget }));
  };
  const measureRenderer = () => {
    const canvas = document.querySelector('canvas');
    const state = canvas ? _roots.get(canvas)?.store.getState() : undefined;
    if (!state) { setResult('Deschide 3D înainte de măsurare.'); return; }
    const { gl, scene } = state;
    const materials = new Set<THREE.Material>();
    let lights = 0;
    scene.traverse(object => { if (object instanceof THREE.Light) lights++; if (object instanceof THREE.Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material); });
    setResult(JSON.stringify({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures, materials: materials.size, programs: gl.info.programs?.length, lights, exposure: gl.toneMappingExposure, shadows: gl.shadowMap.enabled, dpr: gl.getPixelRatio(), width: gl.domElement.width, height: gl.domElement.height }));
  };
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void fetch('/api/persistence-fixture').then(response => {
      if (!response.ok) throw Error('Fixture identity unavailable');
      return response.json();
    }).then(({ owner }) => {
      if (!active) return;
      useAuthStore.getState().setUser(['fixture-a', 'fixture-b'].includes(owner) ? { id: owner, email: `${owner}@example.test`, name: owner, role: 'client' } : null);
      setReady(true);
    }).catch(() => { if (active) setResult('Identitatea contului de test nu este disponibilă. Reîncarcă.'); });
    return () => { active = false; };
  }, []);
  const account = async (id: string) => { await fetch('/api/persistence-fixture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner: id }) }); useAuthStore.getState().setUser({ id, email: `${id}@example.test`, name: id, role: 'client' }); };
  const gestureCheck = useRef<(() => void) | null>(null);
  useEffect(() => () => gestureCheck.current?.(), []);
  const [missingModel, setMissingModel] = useState(false);
  const [locale, setLocale] = useState('ro');
  const [result, setResult] = useState('Verificare locală; fără acces la baza de date sau la AI.');
  const loseContext = () => {
    const canvas = document.querySelector('canvas');
    const gl = canvas?.getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) { setResult('Extensia WEBGL_lose_context nu este disponibilă.'); return; }
    extension.loseContext();
    setResult('Pierdere reală a contextului WebGL solicitată.');
  };
  return <><div className="m-4 rounded border border-amber-400 p-4 text-white"><button className="min-h-11 rounded bg-amber-400 px-4 text-black" onClick={loseContext}>Simulează pierderea contextului WebGL</button><button className="min-h-11 px-3" onClick={() => account('fixture-a')}>Cont local A</button><button className="min-h-11 px-3" onClick={() => account('fixture-b')}>Cont local B</button><button className="min-h-11 px-3" onClick={async () => { const response = await fetch('/api/persistence-fixture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner: 'expired' }) }); if (!response.ok) { setResult('Ieșirea din contul de test a eșuat.'); return; } await clearEditorDrafts(useAuthStore.getState().user?.id ?? 'guest'); useAuthStore.getState().setUser(null); }}>Ieșire cont local</button><button className="min-h-11 px-3" onClick={async () => { const value = await fetch('/api/gym-projects').then(response => response.json()); setResult(`Salvări explicite în serverul de test: ${value.saves}`); }}>Verifică salvările explicite</button><button className="min-h-11 px-3" onClick={async () => { for (const id of ['fixture-a','fixture-b','guest']) await clearEditorDrafts(id); window.location.href = '/'; }}>Resetează ciornele de test</button><button className="min-h-11 px-3" onClick={() => setLocale('en')}>English</button><button className="min-h-11 px-3" onClick={() => setLocale('ro')}>Română</button>{(['pointercancel', 'escape', 'wall', 'opening', 'equipment'] as const).map(kind => <button key={kind} className="min-h-11 px-3" onClick={() => { gestureCheck.current?.(); gestureCheck.current = armGestureCheck(kind, setResult); }}>Test gest: {kind}</button>)}<button className="min-h-11 px-3" onClick={() => { gestureCheck.current?.(); checkSelectTouch(setResult); }}>Test select-touch</button><button className="min-h-11 px-3" onClick={async () => { const response = await fetch('/api/model-fixture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missing: !missingModel }) }); if (!response.ok) { setResult('FAIL: model fixture'); return; } const value = await response.json(); setMissingModel(value.missing); useGLTF.clear('/models/gym/pilot/cad_treadmill.glb'); setResult(value.missing ? 'Banda va răspunde 404. Comută 2D → 3D pentru a verifica placeholder-ul.' : 'GLB restaurat. Comută 2D → 3D pentru reîncărcare.'); }}>{missingModel ? 'Restaurează modelul benzii' : 'Simulează lipsa modelului benzii'}</button><button className="min-h-11 px-3" onClick={measureRenderer}>Citește măsurătorile 3D</button><button className="min-h-11 px-3" onClick={seedAi}>Scenariu AI cu două niveluri</button><button className="min-h-11 px-3" onClick={() => inspectAiDraft(true)}>Capturează ciorna AI</button><button className="min-h-11 px-3" onClick={() => inspectAiDraft(false)}>Compară ciorna AI</button><PersistenceControls report={setResult} /><p role="status" className="break-all">{result}</p></div><LocaleProvider key={locale} initialLocale={locale}>{ready ? <StudioWorkbench /> : <p role="status">Se verifică identitatea contului de test.</p>}</LocaleProvider></>;
}
