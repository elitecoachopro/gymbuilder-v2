'use client';
import { referenceInspectionDirection, isOriginalReferenceModel } from '@/lib/gym-reference-identity';
import { loginHref } from '@/lib/journeys';
import { restoreLoginHandoff } from '@/lib/gym-login-handoff';
import { useAuthStore } from '@/store/auth';
import AiDataConsent from '@/components/AiDataConsent';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Box, Camera, Copy, Download, Dumbbell, Eye, FileText, Layers, Loader2, Maximize2, Minimize2, Plus, Redo2, RotateCw, Save, Search, Settings2, Sparkles, Trash2, Undo2 } from 'lucide-react';
import { useClientLocale } from '@/i18n/client';
import { useUiText } from '@/i18n/useUiText';
import { EQUIPMENT_CATALOG, ZONE_DEFINITIONS } from '@/lib/gym-catalog';
import { importedEquipment } from '@/lib/gym-imported-equipment';
import { EQUIPMENT_PILOT_IDS, pilotEquipmentEvidence } from '@/lib/gym-equipment-pilot';
import { equipmentPilotSpace } from '@/lib/gym-equipment-pilot-space';
import { initialGymCameraView } from '@/lib/gym-camera';
import { INITIAL_GYM_VIEW, INITIAL_GYM_GRAPHICS, type GymGraphicsProfile } from '@/lib/gym-graphics';
import { floorSpace, buildingArea, demoBuildingSpace, floorBudget, FLOOR_RISE_M, type Storey } from '@/lib/gym-building';
import { DEFAULT_VISUALIZATION, type GymVisualization } from '@/lib/gym-visualization';
import { demoSpace, emptySpace, findSpacePosition, itemFitsSpace, spaceArea, spaceBounds, spaceCost, spaceWalls, validateSpace, type GymSpace, type SpaceItem } from '@/lib/gym-space';
import { studioConfigurationSchema, type StudioConfiguration } from '@/lib/gym-studio';
import { gymPresentationHtml } from '@/lib/gym-presentation';
import { applyGymAiReview, createGymAiReview, gymAiReviewCurrent, type GymAiReview } from '@/lib/gym-ai-proposal';
import AiProposalReview from './AiProposalReview';
import type { CameraCommand, StudioView } from './SpaceScene';
import SpacePlan from './SpacePlan';
import EquipmentPlanningDetails from './EquipmentPlanningDetails';
import StructureInspector from './StructureInspector';
import { editStructure, type StructureCommand } from '@/lib/gym-space-edit';
import { createEditorHistory, commitEditorFloor, undoEditor, redoEditor, type EditorDocument as Document } from '@/lib/gym-editor-history';
import { useEditorDraft } from './useEditorDraft';
import Modal from '@/components/Modal';

const SpaceScene = dynamic(() => import('./SpaceScene'), { ssr: false, loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-gold-400" /></div> });
type SavedProject = { id: string; name: string; configuration: StudioConfiguration | null };
type Text = (ro: string, en: string) => string;
const fresh = (): Document => ({ name: 'Imperial Gym · 300 m²', height: 3.5, budget: null, brief: '', space: emptySpace() });
const iconButton = 'inline-flex items-center justify-center gap-2 min-h-11 min-w-11 rounded-lg border border-white/10 px-3 text-sm text-anthracite-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400 disabled:opacity-35 disabled:cursor-not-allowed';
const field = 'w-full min-h-11 rounded-lg border border-white/15 bg-anthracite-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400';
const initialRoom = { length: '20', width: '15', shape: 'rectangle', notchW: '5', notchD: '5' };

function roomDraft(l: GymSpace['outline']) {
  const length = Math.max(...l.map(p => p.x)), width = Math.max(...l.map(p => p.y));
  const rectangle = l.length === 4 && l[0].x === 0 && l[0].y === 0 && l[1].x === length && l[1].y === 0 && l[2].x === length && l[2].y === width && l[3].x === 0 && l[3].y === width;
  const shaped = l.length === 6 && l[0].x === 0 && l[0].y === 0 && l[1].x === length && l[1].y === 0 && l[2].x === length && l[3].x === l[4].x && l[2].y === l[3].y && l[4].y === width && l[5].x === 0 && l[5].y === width;
  return { length: String(length), width: String(width), shape: shaped ? 'l' : rectangle ? 'rectangle' : 'custom', notchW: shaped ? String(length - l[3].x) : '5', notchD: shaped ? String(width - l[2].y) : '5' };
}
function syncProjectLocation(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('id', id); else url.searchParams.delete('id');
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}
function Numeric({ label, value, onChange, min = 0, max = 200, step = 0.1 }: { label: string; value: number | string; onChange: (value: string) => void; min?: number; max?: number; step?: number }) {
  return <label className="block text-xs text-anthracite-300"><span className="block mb-1.5">{label}</span><input className={field} type="number" min={min} max={max} step={step} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function LibraryGlyph({ zone }: { zone: string }) {
  return <svg viewBox="0 0 100 64" className="h-14 w-20" aria-hidden="true"><path d="M10 55H90" stroke="#495562" strokeWidth="2" />{zone === 'cardio' ? <><path d="M18 49H78L83 44H30L22 15H40" fill="none" stroke="#bdc6cc" strokeWidth="5" /><path d="M24 17H43L48 23H29" fill="#bd9757" /><path d="M26 47H72" stroke="#4c6877" strokeWidth="5" /></> : ['greutati', 'functional'].includes(zone) ? <><path d="M25 52V12H76V52M20 38H81" fill="none" stroke="#a8b4bd" strokeWidth="4" /><path d="M23 29V45M29 27V47M71 27V47M77 29V45" stroke="#bd9757" strokeWidth="5" /></> : zone === 'aparate' ? <><path d="M22 52V12H38V52M38 18L74 27V43M31 48H78" fill="none" stroke="#a8b4bd" strokeWidth="5" /><path d="M46 30V43H64" fill="none" stroke="#bd9757" strokeWidth="7" /></> : <><path d="M20 51V24H80V51M19 24H81" fill="none" stroke="#a8b4bd" strokeWidth="5" /><rect x="24" y="29" width="51" height="14" rx="3" fill="#bd9757" /></>}</svg>;
}
function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const englishErrors: Record<string, string> = {
  'Etajul conține date incompatibile.': 'The upper floor contains incompatible data.',
  'Scara depășește conturul spațiului.': 'The staircase extends beyond the room outline.',
  'Datele spațiului sunt invalide.': 'The space data is invalid.',
  'Înălțime sau buget invalid.': 'Invalid height or budget.',
  'Conturul trebuie să pornească de la origine și să aibă minimum 4 m².': 'The outline must start at the origin and cover at least 4 m².',
  'Folosește un contur ortogonal fără laturi nule.': 'Use an orthogonal outline without zero-length edges.',
  'Conturul nu poate avea laturi care se intersectează.': 'The outline cannot intersect itself.',
  'Identificatori duplicați în proiect.': 'Duplicate project identifiers.',
  'Un perete depășește conturul spațiului.': 'A wall extends beyond the room outline.',
  'Un stâlp depășește conturul spațiului.': 'A column extends beyond the room outline.',
  'O zonă depășește conturul spațiului.': 'An area extends beyond the room outline.',
  'O ușă sau fereastră depășește peretele.': 'A door or window extends beyond its wall.',
  'Deschiderile din același perete se suprapun.': 'Openings on the same wall overlap.',
  'Un aparat se suprapune, blochează o ușă sau depășește spațiul ori înălțimea.': 'Equipment overlaps, blocks a door, or exceeds the room bounds or height.',
  'Selectează un perete interior existent.': 'Select an existing partition wall.',
  'Selectează o deschidere existentă.': 'Select an existing opening.',
  'Peretele se suprapune peste un stâlp sau peste scară.': 'The wall overlaps a column or the staircase.',
  'Dotările depășesc bugetul proiectului.': 'Equipment exceeds the project budget.',
};

export default function StudioWorkbench() {
  const locale = useClientLocale(), ui = useUiText();
  const t: Text = (ro, en) => locale === 'en' ? en : ro;
  const [editor, setEditor] = useState(() => createEditorHistory(fresh()));
  const editorRef = useRef(editor);
  const { document: building, storey } = editor.present;
  const history = editor.past, future = editor.future;
  const applyEditor = (next: typeof editor) => { editorRef.current = next; setEditor(next); };
  const setStorey = (level: Storey) => applyEditor({ ...editorRef.current, present: { ...editorRef.current.present, storey: level } });
  const activeSpace = useMemo(() => floorSpace(building.space, storey), [building.space, storey]);
  const doc = { ...building, space: activeSpace };
  const [tab, setTab] = useState<'room' | 'library' | 'finishes' | 'ai'>('room');
  const sceneContainer = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [navigation, setNavigation] = useState<'orbit' | 'pan'>('orbit');
  const [cameraCommand, setCameraCommand] = useState<CameraCommand>({ kind: 'fit', id: 0 });
  const commandCamera = (kind: Exclude<CameraCommand['kind'], 'focus'>) => setCameraCommand(c => ({ kind, id: c.id + 1 }));
  const [mode, setMode] = useState<'2d' | '3d'>(INITIAL_GYM_VIEW), [view, setView] = useState<StudioView>('orbit');
  const [graphicsProfile, setGraphicsProfile] = useState<GymGraphicsProfile>(INITIAL_GYM_GRAPHICS);
  const [graphicsFailed, setGraphicsFailed] = useState(false);
  const [cutaway, setCutaway] = useState(true), [showAreas, setShowAreas] = useState(false);
  const [selected, setSelected] = useState<string | null>(null), [filter, setFilter] = useState('all'), [search, setSearch] = useState('');
  const [pilotOnly, setPilotOnly] = useState(false);
  const [room, setRoom] = useState(initialRoom);
  const [limits, setLimits] = useState({ height: '3.5', budget: '' });
  const [wallDraft, setWallDraft] = useState({ x: '5', y: '1', length: '3', axis: 'y' as 'x' | 'y', thickness: '0.12' });
  const [opening, setOpening] = useState({ wallId: 'edge-0', kind: 'door' as 'door' | 'window', offset: '1', width: '1', height: '2.2', sill: '0' });
  const [column, setColumn] = useState({ x: '8', y: '8', w: '0.4', d: '0.4' });
  const [areaDraft, setAreaDraft] = useState({ id: 'cardio', x: '1', y: '1', w: '5', d: '3' });
  const [position, setPosition] = useState({ x: '', y: '', rotation: '' });
  const accountUser = useAuthStore(s => s.user);
  const accountLoading = useAuthStore(s => s.isLoading);
  const authLeaving = useRef(false);
  const resumeHandled = useRef(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [projectsState, setProjectsState] = useState<'loading' | 'ready' | 'error' | 'guest'>('loading');
  const [projectsRetry, setProjectsRetry] = useState(0);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false), [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]), [savedFingerprint, setSavedFingerprint] = useState(() => JSON.stringify(fresh()));
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null), [aiBusy, setAiBusy] = useState(false);
  const [automaticZoning, setAutomaticZoning] = useState(true);
  const [aiError, setAiError] = useState(''), [aiNeedsLogin, setAiNeedsLogin] = useState(false);
  const aiFeedback = useRef<HTMLDivElement>(null);
  const [sceneArrival, setSceneArrival] = useState(0);
  const [review, setReview] = useState<GymAiReview | null>(null);
  const [presentation, setPresentation] = useState<string | null>(null);
  const presentationFrame = useRef<HTMLIFrameElement>(null);
  const capture = useRef<(() => string) | null>(null);
  const recoverGraphics = useCallback(() => {
    capture.current = null;
    setGraphicsProfile('low');
    setGraphicsFailed(true);
    setMode('2d');
  }, []);
  useEffect(() => {
    const changed = () => setExpanded(document.fullscreenElement === sceneContainer.current);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  const toggleExpanded = async () => {
    try {
      if (document.fullscreenElement === sceneContainer.current) await document.exitFullscreen();
      else await sceneContainer.current?.requestFullscreen();
    } catch { setError(t('Ecranul complet nu este disponibil în acest browser.', 'Fullscreen is unavailable in this browser.')); }
  };
  const accountRevision = useRef(0);
  const loaded = useRef(false), editRevision = useRef(0), busy = saving || aiBusy;
  const bounds = spaceBounds(doc.space), cost = spaceCost(doc.space), fingerprint = JSON.stringify(building);
  const visualization = doc.space.visualization ?? DEFAULT_VISUALIZATION;
  const eyeHeight = Math.min(visualization.eyeHeight, doc.height - 0.2);
  const dirty = fingerprint !== savedFingerprint;
  const item = doc.space.items.find(i => i.id === selected), template = EQUIPMENT_CATALOG.find(e => e.id === item?.templateId);
  const focusItem = (id = selected) => {
    const item = doc.space.items.find(candidate => candidate.id === id);
    const template = EQUIPMENT_CATALOG.find(candidate => candidate.id === item?.templateId);
    if (!item || !template) return;
    setView('orbit'); setCutaway(true);
    setCameraCommand(c => ({ kind: 'focus', id: c.id + 1, target: { x: item.x, y: item.y, length: template.length_m, width: template.width_m, height: template.height_m, direction: referenceInspectionDirection(item.templateId, item.rotation) } }));
  };
  const readyCapture = useCallback((value: (() => string) | null) => { capture.current = value; }, []);
  const commit = (next: Document) => {
    if (busy) return false;
    const result = commitEditorFloor(editorRef.current, next);
    if (result.error) { setError(locale === 'en' ? englishErrors[result.error] || result.error : result.error); return false; }
    if (result.state === editorRef.current) return true;
    editRevision.current++;
    applyEditor(result.state); setError(''); setNotice(''); return true;
  };
  const editSpace = (space: GymSpace) => commit({ ...doc, space });
  const editStructureCommand = (command: StructureCommand): string | null => {
    const result = editStructure(doc.space, command, doc.height, doc.budget);
    if (result.error) return locale === 'en' ? englishErrors[result.error] || result.error : result.error;
    return editSpace(result.space) ? null : t('Modificarea nu a putut fi aplicată.', 'The change could not be applied.');
  };
  const structure = doc.space.walls.find(w => w.id === selected) ?? doc.space.openings.find(o => o.id === selected);
  const updateVisualization = (patch: Partial<GymVisualization>) => editSpace({ ...doc.space, visualization: { ...visualization, ...patch } });
  const travelHistory = (direction: 'undo' | 'redo') => {
    if (busy) return;
    const next = direction === 'undo' ? undoEditor(editorRef.current) : redoEditor(editorRef.current);
    if (next === editorRef.current) return;
    editRevision.current++; applyEditor(next); setSelected(null); setReview(null); setError(''); setNotice('');
  };
  const undo = () => travelHistory('undo'), redo = () => travelHistory('redo');
  const reset = (next: Document, id: string | null = null, level: Storey = 0, baseline = id ? JSON.stringify(next) : '') => { editRevision.current++; syncProjectLocation(id); applyEditor(createEditorHistory(next, level)); setProjectId(id); setSelected(null); setReview(null); setAiError(''); setAiNeedsLogin(false); setError(''); setNotice(''); setSavedFingerprint(baseline); setRoom(roomDraft(next.space.outline)); };
  const draft = useEditorDraft({ document: building, storey, projectId, savedFingerprint, dirty, onOwnerChange: () => { accountRevision.current++; const blank = fresh(); setProjects([]); reset(blank, null, 0, JSON.stringify(blank)); setMode('2d'); } });
  const draftMessage = () => {
    switch (draft.status) {
      case 'checking': return t('Verific recuperarea locală…', 'Checking local recovery…');
      case 'saving': return t('Se salvează ciorna pe acest browser…', 'Saving a draft in this browser…');
      case 'saved':
        if (draft.updatedAt) return t('Ciornă locală actualizată la ', 'Local draft updated at ') + new Date(draft.updatedAt).toLocaleTimeString(locale) + t('. Salvarea în cont se face separat.', '. Saving to your account is separate.');
        break;
      case 'error': return t('Recuperarea locală nu este actualizată. Salvează în cont sau exportă JSON.', 'Local recovery is not up to date. Save to your account or export JSON.');
      case 'signed-out': return t('Sesiune încheiată. Ciornele contului au fost eliminate.', 'Session ended. Account drafts have been cleared.');
    }
    return t('Recuperarea locală este disponibilă în acest browser.', 'Local recovery is available in this browser.');
  };
  const requestReset = (action: () => void) => { if (dirty) setPending(() => action); else action(); };
  const openProject = (project: SavedProject) => {
    const config = studioConfigurationSchema.safeParse(project.configuration);
    if (!config.success || !config.data.space) { setError(t('Acest proiect se deschide în editorul clasic.', 'Open this project in the classic editor.')); return; }
    const next = { name: project.name, height: config.data.height_m, budget: config.data.budget_eur, brief: config.data.brief, space: config.data.space };
    const problem = validateSpace(next.space, next.height, next.budget);
    if (problem) { setError(t('Proiectul salvat are date incompatibile.', 'The saved project contains incompatible data.')); return; }
    reset(next, project.id);
  };
  const checkAi = () => { setAiReady(null); fetch('/api/configurator/ai', { cache: 'no-store', signal: AbortSignal.timeout(8000) }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(v => setAiReady(v.configured === true)).catch(() => setAiReady(false)); };
  useEffect(() => { checkAi(); }, []);
  useEffect(() => {
    const account = accountRevision.current;
    const wanted = new URLSearchParams(window.location.search).get('id');
    setProjectsState('loading');
    fetch('/api/gym-projects', { cache: 'no-store' }).then(r => { if (r.status === 401) { setProjectsState('guest'); return null; } if (!r.ok) throw new Error(); return r.json(); }).then(data => {
      if (!data || account !== accountRevision.current) return;
      const saved = ((data.projects || []) as SavedProject[]).filter(p => p.configuration?.space);
      setProjectsState('ready');
      setProjects(previous => [...previous, ...saved.filter(p => !previous.some(current => current.id === p.id))]);
      if (!loaded.current && wanted && editRevision.current === 0) {
        loaded.current = true; const project = saved.find(p => p.id === wanted);
        if (project) openProject(project); else setError(locale === 'en' ? 'Project not found.' : 'Proiectul nu a fost găsit.');
      }
    }).catch(() => { if (account === accountRevision.current) setProjectsState('error'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectsRetry]);
  useEffect(() => { if (!dirty) return; const warn = (e: BeforeUnloadEvent) => { if (!authLeaving.current) e.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const continueWithLogin = () => {
    try {
      const nonce = crypto.randomUUID();
      sessionStorage.setItem('gymbuilder-login-project', JSON.stringify({ owner: accountUser?.id || 'guest', nonce, document: building, storey, projectId, savedFingerprint, tab, createdAt: Date.now() }));
      authLeaving.current = true;
      window.location.assign(loginHref(`/configurator?resume=${nonce}`));
    } catch { setError(t('Continuarea nu a putut fi pregătită. Exportă proiectul JSON înainte de autentificare.', 'Could not prepare sign-in continuation. Export the project JSON before signing in.')); }
  };
  useEffect(() => {
    if (accountLoading || !accountUser) return;
    const wanted = new URLSearchParams(window.location.search).get('resume');
    if (!wanted || resumeHandled.current) return;
    resumeHandled.current = true;
    try {
      const saved = restoreLoginHandoff(sessionStorage.getItem('gymbuilder-login-project'), wanted, accountUser.id);
      reset(saved.document, saved.projectId, saved.storey, saved.savedFingerprint);
      setTab(saved.tab);
      sessionStorage.removeItem('gymbuilder-login-project');
      const url = new URL(window.location.href); url.searchParams.delete('resume'); window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      setNotice(t('Proiect recuperat după autentificare. Apasă Salvează pentru salvarea în cont.', 'Project restored after sign-in. Choose Save to store it in your account.'));
    } catch { setError(t('Proiectul nu a putut fi recuperat pentru acest cont. Verifică ciorna locală sau importă JSON.', 'Could not restore this project for this account. Check local recovery or import JSON.')); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountLoading, accountUser?.id]);
  useEffect(() => { setRoom(roomDraft(doc.space.outline)); }, [doc.space.outline]);
  useEffect(() => { setLimits({ height: String(doc.height), budget: doc.budget === null ? '' : String(doc.budget) }); }, [doc.height, doc.budget]);
  useEffect(() => { if (item) setPosition({ x: String(item.x), y: String(item.y), rotation: String(item.rotation) }); }, [item]);
  const moveItem = (id: string, x: number, y: number) => {
    const current = doc.space.items.find(i => i.id === id);
    if (!current || busy || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) return false;
    const candidate = { ...current, x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
    if (!itemFitsSpace(doc.space, candidate, doc.height)) { setError(t('Poziție ocupată, în afara sălii sau în dreptul unei uși.', 'Position occupied, outside the room, or blocking a doorway.')); return false; }
    return editSpace({ ...doc.space, items: doc.space.items.map(i => i.id === id ? candidate : i) });
  };
  const changeItem = (candidate: SpaceItem) => editSpace({ ...doc.space, items: doc.space.items.map(i => i.id === candidate.id ? candidate : i) });
  const addItem = (templateId: string) => {
    if (doc.space.items.length >= 300) { setError(t('Maximum 300 de obiecte într-un proiect.', 'A project supports up to 300 objects.')); return; }
    const candidate = findSpacePosition(doc.space, templateId, doc.height, 0) || findSpacePosition(doc.space, templateId, doc.height, 90);
    if (!candidate) { setError(t('Modelul nu încape în spațiul liber sau depășește înălțimea.', 'This model does not fit the free space or exceeds the room height.')); return; }
    const next = { ...candidate, id: crypto.randomUUID() };
    if (editSpace({ ...doc.space, items: [...doc.space.items, next] })) setSelected(next.id);
  };
  const applyRoom = () => {
    const l = Number(room.length), w = Number(room.width), nw = Number(room.notchW), nd = Number(room.notchD);
    if (![l, w].every(n => Number.isFinite(n) && n >= 2 && n <= 200)) { setError(t('Dimensiunile trebuie să fie între 2 și 200 m.', 'Dimensions must be between 2 and 200 m.')); return; }
    if (room.shape === 'l' && (!(nw > 0 && nw < l && nd > 0 && nd < w))) { setError(t('Decupajul trebuie să fie mai mic decât încăperea.', 'The cutout must be smaller than the room.')); return; }
    const outline = room.shape === 'custom' ? doc.space.outline.map(p => ({ x: p.x * l / bounds.length, y: p.y * w / bounds.width })) : room.shape === 'l' ? [{ x: 0, y: 0 }, { x: l, y: 0 }, { x: l, y: w - nd }, { x: l - nw, y: w - nd }, { x: l - nw, y: w }, { x: 0, y: w }] : emptySpace(l, w).outline;
    editSpace({ ...doc.space, outline });
  };
  const save = async () => {
    if (busy) return;
    if (!building.name.trim()) { setError(t('Introdu numele sălii.', 'Enter a gym name.')); return; }
    const problem = validateSpace(building.space, building.height, building.budget); if (problem) { setError(locale === 'en' ? englishErrors[problem] || problem : problem); return; }
    setSaving(true); setError('');
    const account = accountRevision.current;
    try {
      const configuration: StudioConfiguration = { version: 1, height_m: building.height, budget_eur: building.budget, brief: building.brief, zone_ids: ZONE_DEFINITIONS.map(z => z.id), profile: 'balanced', space: building.space };
      const res = await fetch('/api/gym-projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(projectId ? { id: projectId } : {}), name: building.name.trim(), variant: 'plan_existing', total_area: buildingArea(building.space), length_m: spaceBounds(building.space).length, width_m: spaceBounds(building.space).width, zones: [], configuration, status: 'in_progress' }) });
      if (res.status === 401) setNeedsLogin(true);
      if (!res.ok) throw new Error(res.status === 401 ? t('Autentifică-te pentru a salva proiectul în cont.', 'Sign in to save the project to your account.') : t('Salvarea nu a reușit. Proiectul rămâne deschis.', 'Saving failed. Your project is still open.'));
      const data = await res.json(); if (account !== accountRevision.current) return; syncProjectLocation(data.project.id); setProjectId(data.project.id); setProjects(prev => [data.project, ...prev.filter(p => p.id !== data.project.id)]); applyEditor({ ...editorRef.current, present: { ...editorRef.current.present, document: { ...building, name: data.project.name } } }); void draft.markSaved(projectId, fingerprint); setSavedFingerprint(JSON.stringify({ ...building, name: data.project.name })); setNotice(t('Proiect salvat în cont.', 'Project saved to your account.'));
    } catch (e) { if (account === accountRevision.current) setError(e instanceof Error ? e.message : t('Eroare de conexiune.', 'Connection error.')); } finally { setSaving(false); }
  };
  const [aiConsent, setAiConsent] = useState(false);
  const generateAi = async () => {
    if (!aiConsent) return;
    if (busy || doc.brief.trim().length < 10) return;
    setAiBusy(true); setAiError(''); setAiNeedsLogin(false); setReview(null);
    const account = accountRevision.current, snapshot = editorRef.current.present, revision = editRevision.current;
    try {
      const availableBudget = floorBudget(building.space, storey, doc.budget);
      if (availableBudget === 0) throw new Error(t('Bugetul este consumat de celălalt nivel. Mărește bugetul sau modifică dotările.', 'The other storey uses the entire budget. Increase the budget or adjust its equipment.'));
      const response = await fetch('/api/configurator/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(55000), body: JSON.stringify({ aiConsent: true, brief: doc.brief, locale, space: building.space, target_floor: storey, automatic_zoning: automaticZoning, context: { length_m: bounds.length, width_m: bounds.width, total_area: spaceArea(doc.space), height_m: doc.height, budget_eur: building.budget, zone_ids: ZONE_DEFINITIONS.map(z => z.id), profile: 'balanced' } }) });
      const data = await response.json();
      if (account !== accountRevision.current) return;
      if (response.status === 401) setAiNeedsLogin(true);
      if (response.status === 504) throw new DOMException('AI_TIMEOUT', 'TimeoutError');
      if (!response.ok) throw new Error(response.status === 401 ? t('Autentifică-te pentru generare AI.', 'Sign in to generate with AI.') : response.status === 429 ? t('Limita AI a fost atinsă. Încearcă mai târziu.', 'AI limit reached. Try again later.') : response.status === 503 ? t('Serviciul AI nu este configurat. Poți continua editarea manuală.', 'AI is not configured. You can continue editing manually.') : response.status === 400 ? t('Verifică cerințele și dimensiunile sălii, apoi încearcă din nou.', 'Check your requirements and room dimensions, then try again.') : t('Generarea AI nu a reușit. Poți continua editarea manuală.', 'AI generation failed. You can continue editing manually.'));
      try { setReview(createGymAiReview(data, snapshot, revision)); } catch { throw new Error(t('La verificare, propunerea AI nu respectă proiectul. Generează din nou. Proiectul este păstrat.', 'The AI proposal failed project validation. Generate again. Your project is preserved.')); }
    } catch (e) {
      if (account !== accountRevision.current) return;
      setAiError(e instanceof Error && e.name === 'TimeoutError'
        ? t('Generarea AI a expirat. Proiectul este păstrat. Încearcă din nou.', 'AI generation timed out. Your project is preserved. Try again.')
        : e instanceof Error && !(e instanceof TypeError) && !(e instanceof SyntaxError)
          ? e.message
          : t('Nu am putut primi propunerea AI. Verifică conexiunea și încearcă din nou. Proiectul este păstrat.', 'The AI proposal could not be received. Check your connection and try again. Your project is preserved.'));
    } finally { setAiBusy(false); if (account === accountRevision.current) setTab('ai'); }
  };
  useEffect(() => {
    if (!aiBusy && (aiError || review)) {
      aiFeedback.current?.focus({ preventScroll: true });
      aiFeedback.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [aiBusy, aiError, review]);
  useEffect(() => {
    if (!sceneArrival) return;
    sceneContainer.current?.focus({ preventScroll: true });
    sceneContainer.current?.scrollIntoView({ block: 'start' });
  }, [sceneArrival]);
  const applyAi = () => {
    if (busy || !review?.proposal) return;
    const result = applyGymAiReview(editorRef.current, review, editRevision.current, graphicsFailed);
    if (result.error) { setAiError(t('Proiectul s-a schimbat sau propunerea nu este validă. Generează din nou.', 'The project changed or the proposal is invalid. Generate again.')); return; }
    if (result.state !== editorRef.current) { editRevision.current += 1; applyEditor(result.state); }
    setReview(null); setSelected(null); setError('');
    setView('orbit'); setCutaway(true); setShowAreas(review.proposal.space.areas.length > 0); setMode(result.mode); commandCamera('fit');
    setSceneArrival(value => value + 1);
    setNotice(result.mode === '2d' ? t('Propunerea AI este aplicată în 2D. Poți reîncerca 3D explicit. Salvează proiectul după verificare.', 'AI proposal applied in 2D. You can explicitly retry 3D. Save your project after reviewing it.') : t('Propunerea AI este aplicată. Verifică planul 3D și salvează proiectul.', 'AI proposal applied. Review the 3D plan and save your project.'));
  };
  const exportJson = () => downloadFile('imperial-gym-project.json', JSON.stringify({ format: 'gymbuilder-space', version: 2, ...building }, null, 2), 'application/json');
  const importRef = useRef<HTMLInputElement>(null);
  const summary = () => {
    const floors = building.space.upperFloor ? [floorSpace(building.space,0),floorSpace(building.space,1)] : [doc.space];
    const lines = [building.name, `${buildingArea(building.space).toFixed(2)} m²`, `${t('Estimare dotări', 'Indicative equipment cost')}: EUR ${spaceCost(building.space).toLocaleString(locale)}`, t('Prețuri orientative pentru modele standard; fără transport, montaj, TVA și lucrări.', 'Indicative standard-model prices; excludes transport, installation, VAT and building works.'), ...floors.flatMap((floor,index)=>['',index===0?t('Parter','Ground floor'):t('Etaj 1','First floor'),...EQUIPMENT_CATALOG.flatMap(e=>{const count=floor.items.filter(i=>i.templateId===e.id).length;return count?[`${count} × ${ui(e.name)} · ${e.length_m} × ${e.width_m} × ${e.height_m} m · EUR ${count*e.price_eur}`]:[];})]), '', building.brief];
    downloadFile('imperial-gym-equipment.txt', lines.join('\n'), 'text/plain;charset=utf-8');
  };
  const capturePng = () => { if (!capture.current) { setError(t('Deschide mai întâi vizualizarea 3D.', 'Open the 3D view first.')); return; } const a = document.createElement('a'); a.download = `imperial-gym-${spaceArea(doc.space).toFixed(0)}m2-${storey === 0 ? 'ground' : 'upper'}.png`; a.href = capture.current(); a.click(); };
  const tabNames = { room: t('Spațiu', 'Space'), library: t('Aparate', 'Equipment'), finishes: t('Finisaje', 'Finishes'), ai: 'AI' };
  const tabIcons = { room: LayoutIcon, library: Dumbbell, finishes: Layers, ai: Sparkles };

  return <main className="min-h-screen bg-anthracite-950 text-anthracite-50 pb-12" aria-busy={busy}>
    <header className="border-b border-white/10 px-4 lg:px-7 py-4 flex flex-wrap items-center gap-3">
      <Link href="/configurator/classic" className={iconButton} aria-label={t('Editor clasic', 'Classic editor')}><ArrowLeft size={17} /><span className="text-xs">{t("Editor clasic", "Classic editor")}</span></Link>
      <div className="mr-auto"><p className="text-[11px] tracking-[.2em] text-gold-300 uppercase">Imperial Gym</p><h1 className="text-lg font-semibold">{t('Configurator 3D', '3D Configurator')}</h1></div>
      <span className="text-xs text-anthracite-400">{dirty ? t('Modificări nesalvate', 'Unsaved changes') : projectId ? t('Salvat', 'Saved') : t('Proiect nou', 'New project')}</span>
      <button className={iconButton} onClick={() => requestReset(() => reset({ ...fresh(), space: demoSpace(), name: t('Sala demonstrativă · 300 m²', 'Demonstration gym · 300 m²') }))} disabled={busy}><Eye size={16} />{t('Demo 300 m²', '300 m² demo')}</button>
      <button className={iconButton} disabled={busy} onClick={() => requestReset(() => reset({ ...fresh(), name: 'Imperial Gym · 2 × 300 m²', space: demoBuildingSpace() }))}><Layers size={16}/>{t('Demo 2 niveluri', 'Two-storey demo')}</button>
      <button className="btn-primary min-h-11 inline-flex items-center gap-2" disabled={busy} onClick={save}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}{t('Salvează', 'Save')}</button>
    </header>
    <div className="px-4 lg:px-7 py-3 flex flex-wrap gap-4 items-center border-b border-white/10 text-sm">
      <label className="flex items-center gap-2 flex-1 min-w-48"><span className="sr-only">{t('Numele sălii', 'Gym name')}</span><input className="bg-transparent font-medium w-full min-h-11 border-b border-transparent focus:border-gold-400 outline-none" value={doc.name} maxLength={120} disabled={busy} onChange={e => commit({ ...doc, name: e.target.value })} /></label>
      {building.space.upperFloor && <div className="flex flex-wrap gap-2 items-center" aria-label={t('Nivelul proiectului', 'Project storey')}>
        {([0,1] as const).map(level => <button key={level} className={iconButton} disabled={busy} aria-pressed={storey===level} onClick={() => {setStorey(level);setSelected(null);setReview(null);setView('orbit');setCutaway(true);commandCamera('fit');}}>{level===0?t('Parter', 'Ground floor'):t('Etaj 1', 'First floor')}</button>)}
        <span>{t('Total ansamblu', 'Building total')}: {buildingArea(building.space)} m² · {t('Cotă', 'Elevation')} +{storey*FLOOR_RISE_M} m</span>
      </div>}
      <span className="text-gold-200">{spaceArea(doc.space).toFixed(2)} m²</span><span>{bounds.length} × {bounds.width} × {doc.height} m</span><span>{doc.space.items.length} {t('obiecte', 'objects')}</span><span>€{cost.toLocaleString(locale)}</span>
    </div>
    <div className="px-4 lg:px-7 py-2 flex flex-wrap items-center gap-3 text-xs text-anthracite-300" role="status" aria-live="polite">
      {draftMessage()}
      {draft.status === 'error' && <button className={iconButton} onClick={draft.retry}>{t('Reîncearcă recuperarea locală', 'Retry local recovery')}</button>}
    </div>
    {draft.candidate && <Modal label={t('Recuperează ciorna locală', 'Recover local draft')} onClose={() => { void draft.dismiss(); }}><section className="w-full max-w-xl rounded-xl border border-white/15 bg-anthracite-800 p-5 space-y-4">
      <h2 className="text-lg font-semibold">{t('Am găsit o ciornă locală', 'A local draft was found')}</h2>
      <p className="break-words">{draft.candidate.document.name} · {new Date(draft.candidate.updatedAt).toLocaleString(locale)} · {draft.candidate.storey === 1 ? t('Etaj 1', 'First floor') : t('Parter', 'Ground floor')}</p>
      <p className="text-sm text-anthracite-300">{t('Restaurarea înlocuiește proiectul deschis, fără să suprascrie proiectul din cont. Ciorna există doar în acest browser.', 'Restoring replaces the open project without overwriting your account project. This draft exists only in this browser.')}</p>
      <div className="flex flex-wrap gap-3"><button className="btn-primary min-h-11" disabled={busy} onClick={() => { const recovered = draft.accept(); if (!recovered) return; reset(recovered.document, recovered.projectId, recovered.storey, recovered.savedFingerprint); setMode('2d'); setNotice(t('Ciornă restaurată local. Salvează explicit pentru a o păstra în cont.', 'Draft restored locally. Save explicitly to keep it in your account.')); }}>{t('Restaurează ciorna', 'Restore draft')}</button><button className={iconButton} disabled={busy} onClick={() => { void draft.dismiss(); }}>{t('Păstrează proiectul deschis', 'Keep the open project')}</button></div>
    </section></Modal>}
    {pending && <div className="mx-4 my-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 flex flex-wrap items-center gap-3" role="alert"><p className="flex-1">{t('Proiectul curent are modificări nesalvate. Îl înlocuiești?', 'This project has unsaved changes. Replace it?')}</p><button className={iconButton} onClick={() => { pending(); setPending(null); }}>{t('Înlocuiește proiectul', 'Replace project')}</button><button className={iconButton} onClick={() => setPending(null)}>{t('Păstrează proiectul', 'Keep project')}</button></div>}
    {needsLogin && <div className="mx-4 my-3 rounded-xl border border-gold-400/30 p-4"><p>{t('Continuă în cont fără să pierzi proiectul curent.', 'Continue in your account without losing your current project.')}</p><button className="btn-primary mt-3" onClick={continueWithLogin}>{t('Autentificare și revenire la proiect', 'Sign in and return to this project')}</button></div>}
    {projectsState === 'error' && <div role="alert" className="mx-4 my-3 p-3 border border-red-400/30 rounded-xl"><p>{t('Proiectele salvate nu au putut fi încărcate.', 'Saved projects could not be loaded.')}</p><button className={iconButton} onClick={() => setProjectsRetry(n => n + 1)}>{t('Reîncearcă', 'Retry')}</button></div>}
    {projectsState === 'guest' && <p className="mx-4 my-3 text-sm text-anthracite-300">{t('Lucrezi local. Autentifică-te când salvezi în cont; proiectul curent va fi păstrat.', 'You are working locally. Sign in when saving to your account; your current project will be preserved.')}</p>}
    {(error || notice) && <p role={error ? 'alert' : 'status'} className={`mx-4 lg:mx-7 my-3 p-3 rounded-lg text-sm ${error ? 'bg-red-400/10 text-red-200 border border-red-400/30' : 'bg-emerald-400/10 text-emerald-200'}`}>{error || notice}</p>}
    <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_250px] gap-4 p-4 lg:p-6">
      <aside className="order-2 lg:order-none min-w-0 rounded-xl border border-white/10 bg-anthracite-800 overflow-hidden">
        <div className="grid grid-cols-4 border-b border-white/10" role="tablist" aria-label={t('Instrumente', 'Tools')}>{(['room', 'library', 'finishes', 'ai'] as const).map(key => { const Icon = tabIcons[key]; return <button key={key} role="tab" aria-selected={tab === key} aria-controls="studio-panel" id={`studio-tab-${key}`} className={`flex flex-col items-center justify-center gap-1 py-3 min-h-14 text-xs ${tab === key ? 'bg-gold-400/10 text-gold-300 border-b-2 border-gold-400' : 'text-anthracite-300 hover:bg-white/5'}`} onClick={() => setTab(key)}><Icon size={17} />{tabNames[key]}</button>; })}</div>
        <fieldset disabled={busy} className="p-4 space-y-5 max-h-[65vh] overflow-y-auto disabled:opacity-60" id="studio-panel" role="tabpanel" aria-labelledby={`studio-tab-${tab}`}>
          {tab === 'room' && <>
            <div><h2 className="font-medium mb-3">{t('Dimensiunile încăperii', 'Room dimensions')}</h2><div className="grid grid-cols-2 gap-3"><Numeric label={t('Lungime (m)', 'Length (m)')} value={room.length} onChange={length => setRoom({ ...room, length })} min={2} /><Numeric label={t('Lățime (m)', 'Width (m)')} value={room.width} onChange={width => setRoom({ ...room, width })} min={2} /></div>
              <label className="block text-xs text-anthracite-300 mt-3">{t('Forma încăperii', 'Room shape')}<select className={`${field} mt-1.5`} value={room.shape} onChange={e => setRoom({ ...room, shape: e.target.value })}>{room.shape === 'custom' && <option value="custom">{t('Contur importat', 'Imported outline')}</option>}<option value="rectangle">{t('Dreptunghi', 'Rectangle')}</option><option value="l">{t('Formă L', 'L-shaped')}</option></select></label>
              {room.shape === 'l' && <div className="grid grid-cols-2 gap-3 mt-3"><Numeric label={t('Decupaj X (m)', 'Cutout X (m)')} value={room.notchW} onChange={notchW => setRoom({ ...room, notchW })} /><Numeric label={t('Decupaj Y (m)', 'Cutout Y (m)')} value={room.notchD} onChange={notchD => setRoom({ ...room, notchD })} /></div>}
              <button className={`${iconButton} w-full mt-3`} onClick={applyRoom}>{t('Aplică dimensiunile', 'Apply dimensions')}</button><p className="mt-2 text-xs text-anthracite-400">{t('Obiectele existente se păstrează. Modificarea este oprită dacă nu mai încap.', 'Existing objects are preserved. Changes are blocked if they no longer fit.')}</p>
            </div>
            <details><summary className="cursor-pointer py-2 font-medium">{t('Pereți despărțitori', 'Partition walls')}</summary><div className="space-y-3 pt-3"><div className="grid grid-cols-2 gap-3"><Numeric label="X (m)" value={wallDraft.x} onChange={x => setWallDraft({ ...wallDraft, x })} /><Numeric label="Y (m)" value={wallDraft.y} onChange={y => setWallDraft({ ...wallDraft, y })} /><Numeric label={t('Lungime (m)', 'Length (m)')} value={wallDraft.length} onChange={length => setWallDraft({ ...wallDraft, length })} /><Numeric label={t('Grosime (m)', 'Thickness (m)')} min={0.08} step={0.01} max={0.5} value={wallDraft.thickness} onChange={thickness => setWallDraft({ ...wallDraft, thickness })} /></div><label className="block text-xs">{t('Direcție', 'Direction')}<select className={`${field} mt-1`} value={wallDraft.axis} onChange={e => setWallDraft({ ...wallDraft, axis: e.target.value as 'x' | 'y' })}><option value="x">X</option><option value="y">Y</option></select></label><button className={`${iconButton} w-full`} onClick={() => editSpace({ ...doc.space, walls: [...doc.space.walls, { id: crypto.randomUUID(), x: Number(wallDraft.x), y: Number(wallDraft.y), length: Number(wallDraft.length), axis: wallDraft.axis, thickness: Number(wallDraft.thickness) }] })}><Plus size={15} />{t('Adaugă perete', 'Add wall')}</button>
              {doc.space.walls.map((w, index) => <div key={w.id} className="flex items-center text-xs justify-between gap-2"><button className={`${iconButton} flex-1`} aria-label={`${t('Editează peretele', 'Edit wall')} ${index + 1}`} onClick={() => { setSelected(w.id); setMode('2d'); }}>{t('Perete', 'Wall')} {index + 1}: {w.length} m · {w.axis.toUpperCase()}</button><button className={iconButton} aria-label={`${t('Elimină perete', 'Remove wall')} ${index + 1}`} onClick={() => { const problem = editStructureCommand({ kind: 'delete-wall', id: w.id }); if (problem) setError(problem); else if (selected === w.id || doc.space.openings.some(o => o.id === selected && o.wallId === w.id)) setSelected(null); }}><Trash2 size={14} /></button></div>)}</div></details>
            <details><summary className="cursor-pointer py-2 font-medium">{t('Uși și ferestre', 'Doors and windows')}</summary><div className="space-y-3 pt-3"><label className="block text-xs">{t('Perete', 'Wall')}<select className={`${field} mt-1`} value={opening.wallId} onChange={e => setOpening({ ...opening, wallId: e.target.value })}>{spaceWalls(doc.space).map((w, i) => <option key={w.id} value={w.id}>{t('Perete', 'Wall')} {i + 1} · {w.length.toFixed(2)} m · {w.axis.toUpperCase()}</option>)}</select></label><label className="block text-xs">{t('Tip deschidere', 'Opening type')}<select className={`${field} mt-1`} value={opening.kind} onChange={e => setOpening({ ...opening, kind: e.target.value as 'door' | 'window', sill: e.target.value === 'door' ? '0' : '0.9' })}><option value="door">{t('Ușă', 'Door')}</option><option value="window">{t('Fereastră', 'Window')}</option></select></label><div className="grid grid-cols-2 gap-3"><Numeric label={t('Distanță de la început (m)', 'Offset from start (m)')} value={opening.offset} onChange={offset => setOpening({ ...opening, offset })} /><Numeric label={t('Lățime (m)', 'Width (m)')} value={opening.width} onChange={width => setOpening({ ...opening, width })} /><Numeric label={t('Înălțime (m)', 'Height (m)')} value={opening.height} onChange={height => setOpening({ ...opening, height })} />{opening.kind === 'window' && <Numeric label={t('Parapet (m)', 'Sill height (m)')} value={opening.sill} onChange={sill => setOpening({ ...opening, sill })} />}</div><button className={`${iconButton} w-full`} onClick={() => editSpace({ ...doc.space, openings: [...doc.space.openings, { ...opening, id: crypto.randomUUID(), offset: Number(opening.offset), width: Number(opening.width), height: Number(opening.height), sill: Number(opening.sill) }] })}><Plus size={15} />{t('Adaugă deschidere', 'Add opening')}</button><p className="text-xs text-anthracite-400">{t('Distanța se măsoară de la coordonata minimă X sau Y a peretelui. Ușile păstrează 0,9 m liberi în fiecare parte.', 'Offset starts at the wall’s minimum X or Y coordinate. Doors reserve 0.9 m on each side.')}</p>{doc.space.openings.map((o, i) => <div key={o.id} className="flex justify-between items-center text-xs gap-2"><button className={`${iconButton} flex-1`} aria-label={`${t('Editează deschiderea', 'Edit opening')} ${i + 1}`} onClick={() => { setSelected(o.id); setMode('2d'); }}>{o.kind === 'door' ? t('Ușă', 'Door') : t('Fereastră', 'Window')} {i + 1} · {o.width} m</button><button className={iconButton} aria-label={`${t('Elimină deschidere', 'Remove opening')} ${i + 1}`} onClick={() => { const problem = editStructureCommand({ kind: 'delete-opening', id: o.id }); if (problem) setError(problem); else if (selected === o.id) setSelected(null); }}><Trash2 size={14} /></button></div>)}</div></details>
            <details><summary className="cursor-pointer py-2 font-medium">{t('Stâlpi', 'Columns')}</summary><div className="grid grid-cols-2 gap-3 pt-3">{(['x', 'y', 'w', 'd'] as const).map(key => <Numeric key={key} label={`${key.toUpperCase()} (m)`} value={column[key]} onChange={v => setColumn({ ...column, [key]: v })} />)}</div><button className={`${iconButton} w-full mt-3`} onClick={() => editSpace({ ...doc.space, columns: [...doc.space.columns, { id: crypto.randomUUID(), x: Number(column.x), y: Number(column.y), w: Number(column.w), d: Number(column.d) }] })}><Plus size={15} />{t('Adaugă stâlp', 'Add column')}</button>{doc.space.columns.map((c, i) => <div key={c.id} className="flex justify-between items-center text-xs mt-2"><span>{t('Stâlp', 'Column')} {i + 1}: {c.x}, {c.y} m</span><button className={iconButton} aria-label={`${t('Elimină stâlp', 'Remove column')} ${i + 1}`} onClick={() => editSpace({ ...doc.space, columns: doc.space.columns.filter(v => v.id !== c.id) })}><Trash2 size={14} /></button></div>)}</details>
            <details><summary className="cursor-pointer py-2 font-medium">{t('Zone de activitate', 'Activity areas')}</summary><label className="block text-xs mt-3">{t('Zonă', 'Area')}<select className={`${field} mt-1`} value={areaDraft.id} onChange={e => setAreaDraft({ ...areaDraft, id: e.target.value })}>{ZONE_DEFINITIONS.map(z => <option key={z.id} value={z.id}>{ui(z.name)}</option>)}</select></label><div className="grid grid-cols-2 gap-3 mt-3">{(['x', 'y', 'w', 'd'] as const).map(key => <Numeric key={key} label={`${key.toUpperCase()} (m)`} value={areaDraft[key]} onChange={v => setAreaDraft({ ...areaDraft, [key]: v })} />)}</div><button className={`${iconButton} w-full mt-3`} onClick={() => { const z = ZONE_DEFINITIONS.find(z => z.id === areaDraft.id)!; if (editSpace({ ...doc.space, areas: [...doc.space.areas.filter(a => a.id !== z.id), { id: z.id, name: z.name, colour: z.color, x: Number(areaDraft.x), y: Number(areaDraft.y), w: Number(areaDraft.w), d: Number(areaDraft.d) }] })) setShowAreas(true); }}>{t('Aplică zona', 'Apply area')}</button>{doc.space.areas.map(a => <div key={a.id} className="flex justify-between items-center text-xs mt-2"><span>{ui(a.name)} · {(a.w * a.d).toFixed(1)} m²</span><button className={iconButton} aria-label={`${t('Elimină zona', 'Remove area')} ${ui(a.name)}`} onClick={() => editSpace({ ...doc.space, areas: doc.space.areas.filter(v => v.id !== a.id) })}><Trash2 size={14} /></button></div>)}</details>
          </>}
          {tab === 'library' && <><div className="rounded-xl border border-gold-400/30 bg-gold-400/5 p-3 space-y-3"><h2 className="text-sm font-medium text-gold-200">{t('Lot-pilot · 10 aparate', 'Pilot collection · 10 machines')}</h2><p className="text-xs text-anthracite-300">{t('Cardio, greutăți și forță, la scară metrică, cu finisaje detaliate. Deschide sala de prezentare pentru a le inspecta în 3D.', 'Cardio, free weights and strength, in metre scale with detailed finishes. Open the showroom to inspect them in 3D.')}</p><button className={`${iconButton} w-full`} onClick={() => requestReset(() => { reset({ ...fresh(), name: t('Lot-pilot · 10 aparate', 'Pilot collection · 10 machines'), height: 3.5, space: equipmentPilotSpace() }); setGraphicsFailed(false); setMode('3d'); setView('orbit'); setCutaway(true); setShowAreas(false); commandCamera('fit'); setSceneArrival(value => value + 1); })}><Eye size={16} />{t('Vezi lotul în 3D', 'View collection in 3D')}</button>{doc.space.items.some(candidate => EQUIPMENT_PILOT_IDS.includes(candidate.templateId)) && <label className="block text-xs">{t('Inspectează un aparat', 'Inspect a machine')}<select className={`${field} mt-1.5`} value={item && EQUIPMENT_PILOT_IDS.includes(item.templateId) ? item.id : ''} onChange={event => { if (!event.target.value) return; setSelected(event.target.value); setGraphicsFailed(false); setMode('3d'); focusItem(event.target.value); setSceneArrival(value => value + 1); }}><option value="">{t('Alege aparatul pentru apropiere', 'Choose a machine for close-up')}</option>{doc.space.items.filter(candidate => EQUIPMENT_PILOT_IDS.includes(candidate.templateId)).map(candidate => <option key={candidate.id} value={candidate.id}>{ui(EQUIPMENT_CATALOG.find(model => model.id === candidate.templateId)!.name)}</option>)}</select></label>}<label className="flex gap-3 items-center min-h-11 text-sm cursor-pointer"><input type="checkbox" className="accent-gold-400 h-4 w-4" checked={pilotOnly} onChange={event => setPilotOnly(event.target.checked)} />{t('Doar aparatele din lotul-pilot', 'Pilot machines only')}</label></div><label className="block relative"><span className="sr-only">{t('Caută aparat', 'Search equipment')}</span><Search size={15} className="absolute left-3 top-3.5 text-anthracite-400" /><input className={`${field} pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Caută aparat…', 'Search equipment…')} /></label><label className="block text-xs">{t('Categorie', 'Category')}<select className={`${field} mt-1.5`} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{t('Toate categoriile', 'All categories')}</option>{ZONE_DEFINITIONS.map(z => <option key={z.id} value={z.id}>{ui(z.name)}</option>)}</select></label><div className="space-y-2">{EQUIPMENT_CATALOG.filter(e => (!pilotOnly || EQUIPMENT_PILOT_IDS.includes(e.id)) && (filter === 'all' || e.zone === filter) && ui(e.name).toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale))).map(e => <button key={e.id} className="w-full flex gap-3 items-center text-left rounded-xl border border-white/10 bg-[#1c2936] p-2 hover:border-gold-400/60 transition-colors" onClick={() => addItem(e.id)}><LibraryGlyph zone={e.zone} /><span className="flex-1"><span className="block text-sm font-medium">{ui(e.name)}</span><span className="block text-xs text-anthracite-400 mt-1">{e.length_m} × {e.width_m} × {e.height_m} m</span><span className="block text-[11px] text-anthracite-300">{!isOriginalReferenceModel(e.id) && pilotEquipmentEvidence(e.id) ? t('GLB măsurat · fără marcă', 'Measured GLB · unbranded') : t('Model standard · fără certificare de produs', 'Standard model · no product certification')}</span><span className="text-xs text-gold-200">€{e.price_eur.toLocaleString(locale)}</span></span><Plus size={15} /></button>)}</div><p className="text-xs text-anthracite-400">{t('Modele standard, fără afiliere cu un producător. Prețuri orientative.', 'Standard models, not affiliated with a manufacturer. Indicative prices.')}</p></>}
          {tab === 'finishes' && <><h2 className="font-medium">{t('Materialele sălii', 'Room materials')}</h2><label className="block text-xs">{t('Stil interior', 'Interior style')}<select className={`${field} mt-1.5`} value={visualization.interiorStyle ?? 'minimal'} onChange={event => updateVisualization({ interiorStyle: event.target.value as NonNullable<GymVisualization['interiorStyle']> })}><option value="minimal">{t('Luminos · linii simple', 'Bright · clean lines')}</option><option value="warm">{t('Cald · panouri din lemn', 'Warm · wood panels')}</option><option value="industrial">{t('Industrial · plafon antracit', 'Industrial · charcoal ceiling')}</option></select></label><button className={`${iconButton} w-full`} onClick={() => { setGraphicsFailed(false); setMode('3d'); setView('inside'); setCutaway(false); setSceneArrival(value => value + 1); }}><Eye size={15} />{t('Vezi amenajarea din interior', 'View the interior design')}</button><p className="text-xs text-anthracite-400">{t('Plafonul și corpurile de iluminat se văd în modul Interior. În vederea de ansamblu, plafonul se ascunde pentru a putea amenaja sala.', 'Ceiling and fixtures are visible in Interior view. The overview hides the ceiling so you can arrange the gym.')}</p><label className="block text-xs">{t('Pardoseală', 'Flooring')}<select className={`${field} mt-1.5`} value={doc.space.finishes.floor} onChange={e => editSpace({ ...doc.space, finishes: { ...doc.space.finishes, floor: e.target.value as GymSpace['finishes']['floor'] } })}><option value="tartan">{t('Tartan negru · sport', 'Black tartan · sports flooring')}</option><option value="rubber">{t('Cauciuc modular', 'Rubber tiles')}</option><option value="oak">{t('Lemn', 'Wood')}</option><option value="concrete">{t('Beton', 'Concrete')}</option></select></label>{(['wall', 'frame', 'upholstery'] as const).map(key => <label key={key} className="flex items-center justify-between gap-3 text-sm min-h-11"><span>{key === 'wall' ? t('Pereți', 'Walls') : key === 'frame' ? t('Cadru aparate', 'Equipment frame') : t('Tapițerie', 'Upholstery')}</span><input type="color" className="w-14 h-11 rounded cursor-pointer" value={doc.space.finishes[key]} onChange={e => editSpace({ ...doc.space, finishes: { ...doc.space.finishes, [key]: e.target.value } })} /></label>)}</>}
          {tab === 'ai' && <><h2 className="font-medium flex items-center gap-2"><Sparkles size={17} className="text-gold-300" />{t('Asistent de amenajare', 'Layout assistant')}</h2><p className="text-xs text-anthracite-300">{t('AI-ul propune dotările. Într-un spațiu dreptunghiular liber, motorul creează zone, culoar, recepție și două vestiare cu pereți și uși. Arhitectura existentă se păstrează.', 'AI proposes equipment. In an empty rectangular room, the engine creates zones, a corridor, reception and two changing rooms with walls and doors. Existing architecture is preserved.')}</p><label className="block text-xs">{t('Cerințele tale', 'Your requirements')}<textarea className={`${field} mt-1.5 min-h-36 resize-y`} maxLength={6000} value={doc.brief} onChange={e => commit({ ...doc, brief: e.target.value })} placeholder={t('Vreau o sală de bodybuilding, cu trei benzi, două rackuri, recepție și vestiare.', 'I want a bodybuilding gym with three treadmills, two racks, a reception and changing rooms.')} /></label><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-gold-400" checked={automaticZoning} onChange={e => { setAutomaticZoning(e.target.checked); setReview(null); }} /><span>{t('Zonare și compartimentare automată', 'Automatic zoning and partitions')}</span></label><p className="text-xs text-anthracite-400">{t('Cerințele, geometria, scara și dotările nivelului activ sunt trimise către OpenAI la generare. Dotările și compartimentarea propusă se aplică numai după confirmare.', 'Requirements, geometry, stairs and current equipment on the active floor are sent to OpenAI when you generate. Proposed equipment and partitions are applied only after confirmation.')}</p><AiDataConsent checked={aiConsent} onChange={setAiConsent} /><button className="btn-primary w-full min-h-11 flex items-center justify-center gap-2 disabled:opacity-40" onClick={generateAi} disabled={!aiConsent || busy || aiReady !== true || doc.brief.trim().length < 10}>{aiBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}{aiBusy ? t('Se generează propunerea…', 'Generating proposal…') : t('Generează propunerea AI', 'Generate AI proposal')}</button><p className="text-xs text-anthracite-300">{t('Generarea AI necesită autentificare. Verifică previzualizarea 2D înainte de aplicare. După o eroare grafică, rămânem în 2D.', 'AI generation requires sign-in. Review the 2D preview before applying. After a graphics error, the view stays in 2D.')}</p>{aiBusy && <p role="status" className="text-sm text-gold-200">{t('AI-ul pregătește planul. Poate dura până la un minut.', 'AI is preparing the plan. This may take up to a minute.')}</p>}{aiReady !== true && <><p className="text-xs text-amber-200">{aiReady === null ? t('Se verifică disponibilitatea AI…', 'Checking AI availability…') : t('AI indisponibil. Verifică configurarea serverului.', 'AI unavailable. Check the server configuration.')}</p><button className={iconButton} onClick={checkAi}>{t('Reverifică', 'Check again')}</button></>}
            <div ref={aiFeedback} tabIndex={-1} className="scroll-mt-[calc(var(--app-header-height,130px)+1rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400" aria-label={t('Rezultatul generării AI', 'AI generation result')}>
            {aiError && <div role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200 space-y-3"><p>{aiError}</p>{aiNeedsLogin && <><button onClick={continueWithLogin} className={`${iconButton} w-full`}>{t('Autentificare și revenire la proiect', 'Sign in and return to this project')}<ArrowRight size={15} /></button><p className="text-xs">{t('Cerințele sunt păstrate la revenire. După autentificare, apasă din nou «Generează propunerea AI».', 'Your requirements are preserved when you return. After signing in, choose “Generate AI proposal” again.')}</p></>}</div>}
            {review && <AiProposalReview review={review} current={gymAiReviewCurrent(review, editor.present, editRevision.current)} graphicsFailed={graphicsFailed} height={doc.height} onApply={applyAi} />}
            </div>
          </>}
        </fieldset>
      </aside>
      <section ref={sceneContainer} tabIndex={-1} aria-label={t('Planul sălii în configurator', 'Gym plan in the configurator')} className="scroll-mt-[calc(var(--app-header-height,130px)+1rem)] outline-none order-1 lg:order-none min-w-0 space-y-3 [&:fullscreen]:bg-[#101820] [&:fullscreen]:p-4 [&:fullscreen]:overflow-y-auto">
        <div className="flex flex-wrap justify-between gap-2"><div className="flex flex-wrap gap-2"><button className={iconButton} disabled={busy || !history.length} onClick={undo} aria-label={t('Anulează modificarea', 'Undo')}><Undo2 size={17} /></button><button className={iconButton} disabled={busy || !future.length} onClick={redo} aria-label={t('Refă modificarea', 'Redo')}><Redo2 size={17} /></button><button className={`${iconButton} ${mode === '2d' ? 'bg-white/10' : ''}`} aria-pressed={mode === '2d'} onClick={() => setMode('2d')}>2D</button><button className={`${iconButton} ${mode === '3d' ? 'bg-white/10' : ''}`} aria-pressed={mode === '3d'} onClick={() => { setGraphicsFailed(false); setMode('3d'); if (window.matchMedia('(max-width: 767px)').matches) { const initialView = initialGymCameraView(doc.space.outline); setView(initialView); setCutaway(initialView !== 'inside'); } }}>3D</button></div><div className="flex flex-wrap gap-2"><button className={iconButton} onClick={toggleExpanded} aria-label={expanded ? t('Ieși din ecran complet', 'Exit fullscreen') : t('Ecran complet', 'Fullscreen')} title={expanded ? t('Ieși din ecran complet', 'Exit fullscreen') : t('Ecran complet', 'Fullscreen')}>{expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button>{mode === '3d' && <><button className={iconButton} onClick={() => { setView('orbit'); setCutaway(true); commandCamera('fit'); }} aria-pressed={view === 'orbit' && cameraCommand.kind !== 'focus'}><Box size={15} />{t('Sala întreagă', 'Whole room')}</button><button className={iconButton} onClick={() => setView('top')} aria-label={t('Vedere de sus', 'Top view')}><Maximize2 size={15} /></button><button className={iconButton} onClick={() => { setView('inside'); setCutaway(false); }} aria-pressed={view === 'inside'}><Eye size={15} />{t('Interior', 'Interior')}</button></>}</div></div>
        <details className="rounded-lg border border-white/10 bg-anthracite-800 px-3">
          <summary className="min-h-11 flex items-center gap-2 cursor-pointer text-sm text-anthracite-200"><Settings2 size={15} />{t('Setări de afișare și aliniere', 'Display and alignment settings')}</summary>
          <div className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-anthracite-300">
          <label className="flex items-center gap-2">{t('Profil 3D', '3D profile')}<select className={`${field} w-auto`} value={graphicsProfile} onChange={e => setGraphicsProfile(e.target.value as GymGraphicsProfile)}><option value="low">{t('Economic', 'Low power')}</option><option value="auto">{t('Claritate automată', 'Automatic clarity')}</option><option value="standard">{t('Standard', 'Standard')}</option></select></label>
          <span>{t('Pornire în 2D · 3D la cerere', 'Starts in 2D · 3D on request')}</span>
        </div>
        <fieldset disabled={busy} className="flex flex-wrap items-end gap-3 rounded-lg border border-white/10 bg-anthracite-800 p-3">
          <label className="text-xs text-anthracite-300">{t('Pas de aliniere', 'Alignment step')}<select className={`${field} mt-1 w-auto block`} value={visualization.snap} onChange={e => updateVisualization({ snap: Number(e.target.value) as GymVisualization['snap'] })}>{[0.01, 0.05, 0.1, 0.25].map(step => <option key={step} value={step}>{step * 100} cm</option>)}</select></label>
          {mode === '3d' && <>
            <label className="text-xs text-anthracite-300">{t('Iluminare', 'Lighting')}<select className={`${field} mt-1 w-auto block`} value={visualization.lighting} onChange={e => updateVisualization({ lighting: e.target.value as GymVisualization['lighting'] })}><option value="daylight">{t('Zi', 'Daylight')}</option><option value="evening">{t('Seară', 'Evening')}</option><option value="studio">{t('Studio', 'Studio')}</option></select></label>
            <label className="text-xs text-anthracite-300">{t('Perspectivă verticală', 'Vertical field of view')}<select className={`${field} mt-1 w-auto block`} value={visualization.fov} onChange={e => updateVisualization({ fov: Number(e.target.value) })}>{[...new Set([35, 45, 60, 75, visualization.fov])].sort((a, b) => a - b).map(fov => <option key={fov} value={fov}>{fov}°</option>)}</select></label>
            <label className="text-xs text-anthracite-300">{t('Înălțime ochi · Interior', 'Eye height · Interior')}<select className={`${field} mt-1 w-auto block disabled:opacity-40`} disabled={view !== 'inside'} value={eyeHeight} onChange={e => updateVisualization({ eyeHeight: Number(e.target.value) })}>{[...new Set([1.2, 1.5, 1.65, 1.8, 2, eyeHeight])].filter(eye => eye <= doc.height - 0.2).sort((a, b) => a - b).map(eye => <option key={eye} value={eye}>{eye.toFixed(2)} m</option>)}</select></label>
          </>}
        </fieldset>
          </div>
        </details>
        {graphicsFailed && <p role="status" className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{t('Vizualizarea 3D a întâmpinat o problemă. Am revenit la planul 2D; proiectul este păstrat. Poți reîncerca 3D în profilul economic.', 'The 3D view encountered a problem. We switched to the 2D plan; your project is preserved. You can retry 3D in the low power profile.')}</p>}
        <div className={`relative ${expanded ? 'h-[52dvh] min-h-[280px] md:h-[calc(100dvh-240px)]' : 'h-[64dvh] min-h-[360px] lg:h-[66dvh] lg:min-h-[500px]'} rounded-xl bg-[#c3cbc9] border border-white/10 overflow-hidden`} inert={busy}>
          {mode === '3d' ? <SpaceScene key={storey} navigation={navigation} cameraCommand={cameraCommand} profile={graphicsProfile} onFailure={recoverGraphics} space={doc.space} height={doc.height} selected={selected} view={view} cutaway={cutaway} showAreas={showAreas} onSelect={setSelected} onMove={moveItem} onCaptureReady={readyCapture} fallback={t('Scena 3D nu este disponibilă. Folosește planul 2D.', '3D is unavailable. Use the 2D plan.')} /> : <SpacePlan key={storey} space={doc.space} height={doc.height} budget={doc.budget} disabled={busy} onEdit={editStructureCommand} selected={selected} onSelect={setSelected} onMove={moveItem} label={t('Planul sălii în metri', 'Gym floor plan in metres')} />}
          <span className="absolute bottom-3 left-3 text-[10px] tracking-widest text-slate-700 bg-white/65 rounded px-2 py-1 pointer-events-none">Imperial Gym · {spaceArea(doc.space).toFixed(0)} m²</span>
        </div>
        {mode === '3d' && <div className="flex flex-wrap items-center gap-2" aria-label={t('Navigare 3D', '3D navigation')}>
          <button className={iconButton} aria-pressed={navigation === 'orbit'} onClick={() => setNavigation('orbit')}>{t('Rotire', 'Rotate')}</button>
          <button className={iconButton} aria-pressed={navigation === 'pan'} onClick={() => setNavigation('pan')}>{t('Deplasare', 'Pan')}</button>
          <button className={iconButton} onClick={() => commandCamera('in')} aria-label={t('Apropie camera', 'Zoom in')}>+</button>
          <button className={iconButton} onClick={() => commandCamera('out')} aria-label={t('Îndepărtează camera', 'Zoom out')}>−</button>
          <button className={iconButton} onClick={() => { setView('orbit'); commandCamera('fit'); }}>{t('Încadrează sala', 'Fit room')}</button>
          <button className={iconButton} disabled={!item} onClick={() => focusItem()}>{t('Vezi aparatul selectat', 'Focus selected equipment')}</button>
          <p className="w-full text-xs text-anthracite-400">{t('Un deget: rotire sau deplasare. Două degete: zoom și deplasare. Atinge un aparat pentru editare.', 'One finger: rotate or pan. Two fingers: zoom and pan. Tap equipment to edit.')}</p>
        </div>}
        <div className="flex flex-wrap gap-4 text-xs text-anthracite-300"><label className="min-h-11 flex items-center gap-2"><input type="checkbox" checked={cutaway} onChange={e => setCutaway(e.target.checked)} />{t('Pereți în secțiune', 'Cutaway walls')}</label><label className="min-h-11 flex items-center gap-2"><input type="checkbox" checked={showAreas} onChange={e => setShowAreas(e.target.checked)} />{t('Evidențiază zonele', 'Highlight areas')}</label><label className="min-h-11 flex items-center gap-2"><input type="checkbox" disabled={busy} checked={visualization.dimensions} onChange={e => updateVisualization({ dimensions: e.target.checked })} />{t('Cote contur și aparat', 'Room and equipment dimensions')}</label><p className="flex items-center ml-auto text-anthracite-400">{t('Selectează un obiect pentru editare. Pozițiile sunt în metri.', 'Select an object to edit. Positions are in metres.')}</p></div>
        {structure && selected && <StructureInspector key={`${storey}:${JSON.stringify(structure)}`} space={doc.space} selected={selected} disabled={busy} onEdit={editStructureCommand} onClose={() => setSelected(null)} t={t} />}
        <div className={`rounded-xl border border-white/10 bg-anthracite-800 p-4 ${expanded ? '' : 'xl:hidden'}`}><Inspector space={doc.space} item={item} template={template} position={position} setPosition={setPosition} move={moveItem} change={changeItem} add={addItem} remove={() => { if (editSpace({ ...doc.space, items: doc.space.items.filter(i => i.id !== selected) })) setSelected(null); }} t={t} ui={ui} busy={busy} /></div>
        <p className="text-xs text-anthracite-400 leading-relaxed">{t('Plan conceptual. Modele standard și costuri orientative; fără transport, montaj, TVA sau lucrări. Distanțele de lucru, evacuarea, accesibilitatea și instalațiile necesită verificare de specialitate.', 'Concept plan. Standard models and indicative costs; excludes transport, installation, VAT and building works. Operating clearances, evacuation, accessibility and building services require professional review.')}</p>
      </section>
      <aside className="order-3 lg:order-none space-y-4 min-w-0">
        <fieldset disabled={busy} className="hidden xl:block rounded-xl border border-white/10 bg-anthracite-800 p-4"><Inspector space={doc.space} item={item} template={template} position={position} setPosition={setPosition} move={moveItem} change={changeItem} add={addItem} remove={() => { if (editSpace({ ...doc.space, items: doc.space.items.filter(i => i.id !== selected) })) setSelected(null); }} t={t} ui={ui} busy={busy} /></fieldset>
        <fieldset disabled={busy} className="rounded-xl border border-white/10 bg-anthracite-800 p-4 space-y-4"><Link href="/cum-functioneaza" className="text-xs text-gold-300 underline">{t("Ghid de utilizare", "User guide")}</Link><h2 className="text-sm font-medium flex items-center gap-2"><Settings2 size={16} />{t('Proiect și livrabile', 'Project and exports')}</h2><Numeric label={t('Înălțime liberă (m)', 'Clear height (m)')} value={limits.height} min={2} max={30} onChange={height => setLimits({ ...limits, height })} /><Numeric label={t('Buget dotări EUR (gol = fără plafon)', 'Equipment budget EUR (blank = no cap)')} value={limits.budget} min={1} max={99999999} step={100} onChange={budget => setLimits({ ...limits, budget })} /><button className={`${iconButton} w-full`} onClick={() => commit({ ...doc, height: Number(limits.height), budget: limits.budget ? Number(limits.budget) : null })}>{t('Aplică înălțimea și bugetul', 'Apply height and budget')}</button><button className={`${iconButton} w-full`} disabled={mode !== '3d'} onClick={capturePng}><Camera size={15} />{t('Imagine PNG', 'PNG image')}</button><button className={`${iconButton} w-full`} onClick={() => setPresentation(gymPresentationHtml({ ...doc, name: doc.name + (building.space.upperFloor ? (storey === 0 ? t(' · Parter', ' · Ground floor') : t(' · Etaj 1', ' · First floor')) : '') }, locale, mode === '3d' ? capture.current?.() : undefined))}><FileText size={15} />{t('Prezentare / PDF · etaj activ', 'Presentation / PDF · active floor')}</button><button className={`${iconButton} w-full`} onClick={summary}><FileText size={15} />{t('Lista dotărilor · toate nivelurile', 'Equipment list · all floors')}</button><button className={`${iconButton} w-full`} onClick={exportJson}><Download size={15} />{t('Export JSON · toate nivelurile', 'Export JSON · all floors')}</button><button className={`${iconButton} w-full`} onClick={() => importRef.current?.click()}>{t('Import proiect JSON', 'Import project JSON')}</button><input ref={importRef} type="file" accept=".json,application/json" className="sr-only" aria-label={t('Import proiect JSON', 'Import project JSON')} onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
          try { if (file.size > 2000000) throw new Error(); const value = JSON.parse(await file.text()); const config = studioConfigurationSchema.safeParse({ version: 1, height_m: value.height, budget_eur: value.budget, brief: value.brief, zone_ids: ['cardio'], profile: 'balanced', space: value.space }); if (value.format !== 'gymbuilder-space' || ![1, 2].includes(value.version) || typeof value.name !== 'string' || value.name.length > 120 || !value.name.trim() || !config.success || validateSpace(config.data.space!, value.height, value.budget)) throw new Error(); requestReset(() => reset({ name: value.name, height: value.height, budget: value.budget, brief: value.brief, space: config.data.space! })); } catch { setError(t('Fișierul nu este un proiect Imperial Gym valid.', 'This file is not a valid Imperial Gym project.')); }
        }} /><button className={`${iconButton} w-full`} onClick={() => requestReset(() => reset(fresh()))}><Plus size={15} />{t('Proiect nou', 'New project')}</button>{projects.length > 0 && <label className="block text-xs">{t('Proiecte salvate', 'Saved projects')}<select className={`${field} mt-1.5`} value={projectId || ''} onChange={e => { const p = projects.find(p => p.id === e.target.value); if (p) requestReset(() => openProject(p)); }}><option value="">{t('Alege proiectul', 'Choose project')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}</fieldset>
      </aside>
    </div>
    {presentation && <Modal label={t('Prezentarea proiectului', 'Project presentation')} onClose={() => setPresentation(null)}><section className="w-full rounded-xl overflow-hidden bg-anthracite-800">
      <header className="flex flex-wrap items-center justify-between gap-3 p-4"><h2 className="font-medium">{t('Prezentarea proiectului', 'Project presentation')}</h2><button className={iconButton} onClick={() => presentationFrame.current?.contentWindow?.print()}>{t('Tipărește / Salvează PDF', 'Print / Save PDF')}</button><button className={iconButton} onClick={() => setPresentation(null)}>{t('Închide', 'Close')}</button></header>
      <iframe ref={presentationFrame} title={t('Document de prezentare', 'Presentation document')} srcDoc={presentation} className="w-full h-[75dvh] border-0 bg-white" />
    </section></Modal>}

  </main>;
}
function LayoutIcon({ size = 17 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 3H21V21H3ZM3 9H13V21M13 3V9H21" /></svg>; }
function Inspector({ space, item, template, position, setPosition, move, change, add, remove, t, ui, busy }: { space: GymSpace; item?: SpaceItem; template?: typeof EQUIPMENT_CATALOG[number]; position: { x: string; y: string; rotation: string }; setPosition: (p: { x: string; y: string; rotation: string }) => void; move: (id: string, x: number, y: number) => boolean; change: (item: SpaceItem) => boolean; add: (templateId: string) => void; remove: () => void; t: Text; ui: <T>(value: T) => T; busy: boolean }) {
  if (!item || !template) return <div className="py-3 text-sm"><Box size={24} className="text-gold-300 mb-3" /><h2 className="font-medium">{t('Inspector obiect', 'Object inspector')}</h2><p className="text-xs text-anthracite-400 mt-2">{t('Selectează un aparat în plan sau adaugă unul din bibliotecă.', 'Select equipment in the plan or add an item from the library.')}</p></div>;
  const imported = isOriginalReferenceModel(template.id) ? null : importedEquipment(template.id);
  return <div className="space-y-4"><h2 className="font-medium text-sm">{ui(template.name)}</h2>{imported && <div className="rounded-lg border border-gold-400/25 bg-gold-400/5 p-3 space-y-2 text-xs"><p className="text-gold-200">{imported.asset.cadUrl ? 'CAD' : 'GLB'} · Innerscene · CC0</p><p className="text-anthracite-300">{t('Model fără marcă. Dimensiuni nominale din modelul 3D; preț orientativ.', 'Unbranded model. Nominal 3D dimensions; indicative price.')}</p><div className="flex flex-wrap gap-2"><a className="underline underline-offset-4 min-h-11 inline-flex items-center" href={imported.asset.url} download>GLB</a>{imported.asset.cadUrl && <a className="underline underline-offset-4 min-h-11 inline-flex items-center" href={imported.asset.cadUrl} download>CAD STEP</a>}<a className="underline underline-offset-4 min-h-11 inline-flex items-center" href={imported.asset.sourceUrl} target="_blank" rel="noopener noreferrer">{t('Sursă', 'Source')}</a><a className="underline underline-offset-4 min-h-11 inline-flex items-center" href={imported.asset.licenseUrl} target="_blank" rel="noopener noreferrer">{t('Licență', 'License')}</a></div></div>}<EquipmentPlanningDetails space={space} item={item} template={template} t={t} /><p className="text-xs text-anthracite-400">{template.length_m} × {template.width_m} × {template.height_m} m · €{template.price_eur.toLocaleString()}</p><div className="grid grid-cols-2 gap-3"><Numeric label="X (m)" value={position.x} onChange={x => setPosition({ ...position, x })} /><Numeric label="Y (m)" value={position.y} onChange={y => setPosition({ ...position, y })} /></div><Numeric label={t('Rotație (grade)', 'Rotation (degrees)')} max={359} step={15} value={position.rotation} onChange={rotation => setPosition({ ...position, rotation })} /><button className={`${iconButton} w-full`} disabled={busy} onClick={() => { if ([position.x, position.y, position.rotation].some(v => v.trim() === '')) return; change({ ...item, x: Number(position.x), y: Number(position.y), rotation: Number(position.rotation) }); }}>{t('Aplică poziția', 'Apply position')}</button><div className="grid grid-cols-3 gap-2"><span /><button className={iconButton} disabled={busy} aria-label={t('Mută sus 10 cm', 'Move up 10 cm')} onClick={() => move(item.id, item.x, item.y - 0.1)}><ArrowUp size={15} /></button><span /><button className={iconButton} disabled={busy} aria-label={t('Mută stânga 10 cm', 'Move left 10 cm')} onClick={() => move(item.id, item.x - 0.1, item.y)}><ArrowLeft size={15} /></button><button className={iconButton} disabled={busy} aria-label={t('Rotește 15 grade', 'Rotate 15 degrees')} onClick={() => change({ ...item, rotation: (item.rotation + 15) % 360 })}><RotateCw size={15} /></button><button className={iconButton} disabled={busy} aria-label={t('Mută dreapta 10 cm', 'Move right 10 cm')} onClick={() => move(item.id, item.x + 0.1, item.y)}><ArrowRight size={15} /></button><span /><button className={iconButton} disabled={busy} aria-label={t('Mută jos 10 cm', 'Move down 10 cm')} onClick={() => move(item.id, item.x, item.y + 0.1)}><ArrowDown size={15} /></button><span /></div><div className="grid grid-cols-2 gap-2"><button className={iconButton} disabled={busy} onClick={() => add(item.templateId)}><Copy size={14} />{t('Duplică', 'Duplicate')}</button><button className={iconButton} disabled={busy} onClick={remove}><Trash2 size={14} />{t('Elimină', 'Remove')}</button></div></div>;
}
