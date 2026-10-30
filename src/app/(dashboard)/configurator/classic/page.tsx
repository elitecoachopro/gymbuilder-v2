'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginHref } from '@/lib/journeys';
import GymDesignAssistant, { type ReviewedGymDesign } from '@/components/GymDesignAssistant';
import { studioConfigurationSchema, equipmentCost, validStudioProject, type StudioConfiguration, type StudioEquipment } from '@/lib/gym-studio';
import { useUiText } from '@/i18n/useUiText';
import { useClientLocale } from '@/i18n/client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { layoutZones, equipmentFits, findEquipmentPosition, validProjectGeometry } from '@/lib/gym-layout';
import { ArrowLeft, ArrowRight, Check, Dumbbell, LayoutGrid, Move, Save, Loader2, Info, Package, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const GymScene3D = dynamic(() => import('@/components/GymScene3D'), { ssr: false, loading: () => <div className="w-full h-[clamp(260px,65dvh,600px)] rounded-xl bg-anthracite-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div> });

import { ZONE_DEFINITIONS, EQUIPMENT_CATALOG, type EquipmentTemplate } from '@/lib/gym-catalog';

interface Zone {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  area_m2: number;
}

type PlacedEquipment = StudioEquipment;
const initialConfiguration: StudioConfiguration = { version: 1, height_m: 3, budget_eur: null, brief: '', zone_ids: ZONE_DEFINITIONS.map(z => z.id), profile: 'balanced' };

export default function GymConfigurator() {
  const ui = useUiText();
  const locale = useClientLocale();
  const [step, setStep] = useState(1);
  const [configuration, setConfiguration] = useState<StudioConfiguration>(initialConfiguration);
  const [legacyConfiguration, setLegacyConfiguration] = useState(false);
  const [requirementsDraft, setRequirementsDraft] = useState<StudioConfiguration>(initialConfiguration);
  const pendingRequirements = JSON.stringify(configuration) !== JSON.stringify(requirementsDraft);
  const [previousDesign, setPreviousDesign] = useState<{ zones: Zone[]; equipment: PlacedEquipment[]; configuration: StudioConfiguration; requirements: StudioConfiguration; legacy: boolean; length: string; width: string; area: string; step: number } | null>(null);
  const [variant, setVariant] = useState<'plan_existing' | 'from_scratch' | null>(null);
  const [totalArea, setTotalArea] = useState('');
  const [lengthM, setLengthM] = useState('');
  const [widthM, setWidthM] = useState('');
  const [customZoneAreas, setCustomZoneAreas] = useState<Record<string, string>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const wantedProject = useSearchParams()?.get('id') || '';
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [projectLinkError, setProjectLinkError] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string; variant: 'plan_existing' | 'from_scratch'; total_area: number; length_m: number; width_m: number; zones: Array<Zone & { equipment?: PlacedEquipment[] }>; configuration?: StudioConfiguration | null }>>([]);
  const [projectName, setProjectName] = useState(() => ui('Proiect Sală'));

  // Equipment state
  const [placedEquipment, setPlacedEquipment] = useState<PlacedEquipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState('receptie');
  const [planMode, setPlanMode] = useState<'2d' | '3d'>('3d');
  const [showLibrary, setShowLibrary] = useState(true);

  // SVG drag state
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ zoneId: string; edge: 'right' | 'bottom' | 'right-bottom' } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Equipment drag state
  const [draggingEquipment, setDraggingEquipment] = useState<{ instanceId: string } | null>(null);
  const [equipDragStart, setEquipDragStart] = useState<{ x: number; y: number } | null>(null);

  const canProceedStep2 = totalArea && lengthM && widthM && Number(totalArea) > 0 && Number(lengthM) > 0 && Number(widthM) > 0;

  const generateZones = useCallback(() => {
    try {
      const total = Number(totalArea);
      const selectedDefinitions = ZONE_DEFINITIONS.filter(def => requirementsDraft.zone_ids.includes(def.id));
      const specified = selectedDefinitions.filter(def => variant === 'plan_existing' && customZoneAreas[def.id] !== undefined && customZoneAreas[def.id] !== '');
      const specifiedSum = specified.reduce((sum, def) => sum + Number(customZoneAreas[def.id]), 0);
      const defaults = selectedDefinitions.filter(def => !specified.includes(def));
      const weight = defaults.reduce((sum, def) => sum + def.defaultPercent, 0);
      const allocation = selectedDefinitions.map(def => ({ ...def, area_m2: specified.includes(def) ? Number(customZoneAreas[def.id]) : (total - specifiedSum) * def.defaultPercent / weight }));
      const layout = layoutZones(allocation, total, Number(lengthM), Number(widthM));
      const applied = { ...requirementsDraft, zone_ids: layout.map(z => z.id) };
      setZones(layout); setLegacyConfiguration(false); setConfiguration(applied); setRequirementsDraft(applied); setSelectedEquipment(null);
      setPlacedEquipment([]); setSaveError(''); return true;
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Dimensiuni invalide.'); return false; }
  }, [totalArea, lengthM, widthM, variant, customZoneAreas, requirementsDraft]);

  const goToStep3 = () => {
    if (!studioConfigurationSchema.safeParse(requirementsDraft).success) { setSaveError('Completează cerințele și verifică dimensiunile.'); return; }
    if (generateZones()) setStep(3);
  };
  const applyDesign = ({ brief, proposal }: ReviewedGymDesign) => {
    setPreviousDesign({ zones, equipment: placedEquipment, configuration, requirements: requirementsDraft, legacy: legacyConfiguration, length: lengthM, width: widthM, area: totalArea, step });
    setLengthM(String(brief.length_m)); setWidthM(String(brief.width_m)); setTotalArea(String(brief.total_area));
    const applied: StudioConfiguration = { version: 1, height_m: brief.height_m, budget_eur: brief.budget_eur, brief: brief.brief, zone_ids: brief.zone_ids, profile: brief.profile };
    setConfiguration(applied); setRequirementsDraft(applied); setLegacyConfiguration(false);
    setZones(proposal.zones); setPlacedEquipment(proposal.equipment); setSelectedZone(proposal.zones[0].id);
    setVariant(previous => previous || 'from_scratch'); setSelectedEquipment(null); setSaveError(''); setSaved(false); setPlanMode('3d'); setStep(3);
  };
  const restoreDesign = () => {
    if (!previousDesign) return;
    setZones(previousDesign.zones); setPlacedEquipment(previousDesign.equipment); setConfiguration(previousDesign.configuration); setRequirementsDraft(previousDesign.requirements); setLegacyConfiguration(previousDesign.legacy);
    setLengthM(previousDesign.length); setWidthM(previousDesign.width); setTotalArea(previousDesign.area); setStep(previousDesign.step);
    setSelectedEquipment(null); setPreviousDesign(null); setSaved(false);
  };
  useEffect(() => {
    fetch('/api/gym-projects', { signal: AbortSignal.timeout(8000) }).then(async res => { if (!res.ok) throw new Error(); setProjects((await res.json()).projects || []); }).catch(() => setProjectLinkError('Proiectele salvate nu au putut fi încărcate.')).finally(() => setProjectsLoaded(true));
  }, []);
  const openProject = useCallback((id: string) => {
    const project = projects.find(item => item.id === id);
    if (!project) return;
    if (project.configuration?.space) { window.location.assign(`/configurator/studio?id=${encodeURIComponent(project.id)}`); return; }
    setProjectId(project.id); setProjectName(project.name); setVariant(project.variant);
    const config = studioConfigurationSchema.safeParse(project.configuration);
    const knownZoneIds = ZONE_DEFINITIONS.filter(z => project.zones.some(zone => zone.id === z.id)).map(z => z.id);
    const normalized: StudioConfiguration = config.success ? config.data : { version: 1, height_m: 3, budget_eur: null, brief: '', zone_ids: knownZoneIds.length ? knownZoneIds : initialConfiguration.zone_ids, profile: 'balanced' };
    setConfiguration(normalized); setRequirementsDraft(normalized); setLegacyConfiguration(!config.success);
    setPreviousDesign(null); setSelectedEquipment(null); setSaved(false);
    setTotalArea(String(project.total_area)); setLengthM(String(project.length_m)); setWidthM(String(project.width_m));
    setZones(project.zones.map(({ equipment: _equipment, ...zone }) => zone)); setPlacedEquipment(project.zones.flatMap(zone => zone.equipment || []));
    setCustomZoneAreas(Object.fromEntries(project.zones.map(zone => [zone.id, String(zone.area_m2)])));
    setSaveError(''); setStep(3);
  }, [projects]);
  const initialProjectOpened = useRef(false);
  useEffect(() => {
    if (initialProjectOpened.current || !projectsLoaded || !wantedProject || !!projectLinkError) return;
    initialProjectOpened.current = true;
    if (projects.some(p => p.id === wantedProject)) openProject(wantedProject);
    else setProjectLinkError('Proiectul nu a fost găsit.');
  }, [projects, projectsLoaded, wantedProject, projectLinkError, openProject]);


  // Convert real meters to SVG percentage units
  const metersToSvgPercent = useCallback((meters: number, axis: 'x' | 'y') => {
    const totalM = axis === 'x' ? Number(lengthM) : Number(widthM);
    if (!totalM) return 5;
    return (meters / totalM) * 100;
  }, [lengthM, widthM]);

  // Add equipment from library to a zone
  const addEquipmentToZone = (template: EquipmentTemplate) => {
    if (placedEquipment.length >= 500) { setSaveError('Limită de 500 de machete pe proiect.'); return; }
    const targetZone = zones.find(z => z.id === template.zone);
    if (!targetZone) { setSaveError('Adaugă mai întâi zona necesară în propunere.'); return; }
    if (template.height_m > configuration.height_m) { setSaveError('Înălțimea spațiului este insuficientă pentru acest model.'); return; }
    if (configuration.budget_eur !== null && equipmentCost(placedEquipment) + template.price_eur > configuration.budget_eur) { setSaveError('Modelul depășește bugetul de dotări.'); return; }

    const eqW = metersToSvgPercent(template.length_m, 'x');
    const eqH = metersToSvgPercent(template.width_m, 'y');

    const position = findEquipmentPosition(targetZone, eqW, eqH, placedEquipment);
    if (!position) { setSaveError('Echipamentul nu încape în zona selectată sau nu mai există spațiu liber.'); return; }
    const newEquip: PlacedEquipment = { instanceId: crypto.randomUUID(), templateId: template.id, name: template.name, zoneId: template.zone, ...position, w: eqW, h: eqH, width_m: template.width_m, length_m: template.length_m, height_m: template.height_m, rotation: 0 };
    setPlacedEquipment(previous => [...previous, newEquip]);
    setSelectedEquipment(newEquip.instanceId); setSaveError(''); setSaved(false);
  };

  const moveEquipment = (instanceId: string, deltaX: number, deltaY: number) => {
    setPlacedEquipment(previous => previous.map(equipment => {
      if (equipment.instanceId !== instanceId) return equipment;
      const zone = zones.find(item => item.id === equipment.zoneId);
      if (!zone) return equipment;
      const candidate = { ...equipment, x: Math.max(zone.x, Math.min(zone.x + zone.w - equipment.w, equipment.x + deltaX)), y: Math.max(zone.y, Math.min(zone.y + zone.h - equipment.h, equipment.y + deltaY)) };
      return equipmentFits(candidate, zone, previous) ? candidate : equipment;
    }));
    setSaved(false);
  };

  const moveEquipment3D = (id: string, x: number, y: number) => {
    const item = placedEquipment.find(e => e.instanceId === id), zone = zones.find(z => z.id === item?.zoneId);
    if (!item || !zone) return false;
    if (Math.abs(item.x - x) < 0.00001 && Math.abs(item.y - y) < 0.00001) return true;
    const candidate = { ...item, x, y };
    if (!equipmentFits(candidate, zone, placedEquipment)) return false;
    setPlacedEquipment(previous => previous.map(e => e.instanceId === id ? candidate : e)); setSaved(false); return true;
  };
  const rotateEquipment = (id: string) => {
    const item = placedEquipment.find(e => e.instanceId === id), zone = zones.find(z => z.id === item?.zoneId);
    if (!item || !zone) return;
    const candidate = { ...item, w: item.width_m / Number(lengthM) * 100, h: item.length_m / Number(widthM) * 100, length_m: item.width_m, width_m: item.length_m, rotation: ((item.rotation || 0) + 90) % 360 };
    if (equipmentFits(candidate, zone, placedEquipment)) { setPlacedEquipment(previous => previous.map(e => e.instanceId === id ? candidate : e)); setSaved(false); setSaveError(''); }
    else setSaveError('Rotirea ar suprapune un alt model sau ar depăși zona.');
  };

  // Remove placed equipment
  const removeEquipment = (instanceId: string) => {
    setSaved(false);
    setPlacedEquipment(prev => prev.filter(e => e.instanceId !== instanceId));
    if (selectedEquipment === instanceId) setSelectedEquipment(null);
  };

  // Equipment drag handlers
  const handleEquipPointerDown = (e: React.PointerEvent<SVGGElement>, instanceId: string) => {
    if (!e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSaved(false);
    e.preventDefault();
    e.stopPropagation();
    setDraggingEquipment({ instanceId });
    setEquipDragStart({ x: e.clientX, y: e.clientY });
    setSelectedEquipment(instanceId);
  };

  const handleEquipMouseMove = useCallback((e: PointerEvent) => {
    if (!e.isPrimary || !draggingEquipment || !equipDragStart || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - equipDragStart.x) / svgRect.width) * 100;
    const deltaYPercent = ((e.clientY - equipDragStart.y) / svgRect.height) * 100;

    setPlacedEquipment(prev => prev.map(eq => {
      if (eq.instanceId !== draggingEquipment.instanceId) return eq;
      const zone = zones.find(item => item.id === eq.zoneId);
      if (!zone) return eq;
      const candidate = { ...eq, x: Math.max(zone.x, Math.min(zone.x + zone.w - eq.w, eq.x + deltaXPercent)), y: Math.max(zone.y, Math.min(zone.y + zone.h - eq.h, eq.y + deltaYPercent)) };
      return equipmentFits(candidate, zone, prev) ? candidate : eq;
    }));

    setEquipDragStart({ x: e.clientX, y: e.clientY });
  }, [draggingEquipment, equipDragStart, zones]);

  const handleEquipMouseUp = useCallback(() => {
    setDraggingEquipment(null);
    setEquipDragStart(null);
  }, []);

  useEffect(() => {
    if (draggingEquipment) {
      window.addEventListener('pointermove', handleEquipMouseMove);
      window.addEventListener('pointerup', handleEquipMouseUp);
      window.addEventListener('pointercancel', handleEquipMouseUp);
      window.addEventListener('blur', handleEquipMouseUp);
      return () => {
        window.removeEventListener('pointermove', handleEquipMouseMove);
        window.removeEventListener('pointerup', handleEquipMouseUp);
        window.removeEventListener('pointercancel', handleEquipMouseUp);
        window.removeEventListener('blur', handleEquipMouseUp);
      };
    }
  }, [draggingEquipment, handleEquipMouseMove, handleEquipMouseUp]);

  // Zone resize handlers
  const handleZonePointerDown = (e: React.PointerEvent<SVGCircleElement>, zoneId: string, edge: 'right' | 'bottom' | 'right-bottom') => {
    if (!e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedZone(zoneId);
    setSaved(false);
    e.preventDefault();
    e.stopPropagation();
    setDragging({ zoneId, edge });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: PointerEvent) => {
    if (!e.isPrimary || !dragging || !dragStart || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStart.x) / svgRect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStart.y) / svgRect.height) * 100;

    setZones(prev => prev.map(zone => {
      if (zone.id !== dragging.zoneId) return zone;
      let newW = zone.w;
      let newH = zone.h;
      if (dragging.edge === 'right' || dragging.edge === 'right-bottom') {
        newW = Math.max(8, Math.min(100 - zone.x, zone.w + deltaXPercent));
      }
      if (dragging.edge === 'bottom' || dragging.edge === 'right-bottom') {
        newH = Math.max(5, Math.min(100 - zone.y, zone.h + deltaYPercent));
      }
      const totalAreaNum = Number(totalArea);
      if (prev.some(other => other.id !== zone.id && zone.x < other.x + other.w - 0.001 && zone.x + newW > other.x + 0.001 && zone.y < other.y + other.h - 0.001 && zone.y + newH > other.y + 0.001)) return zone;
      if (placedEquipment.some(eq => eq.zoneId === zone.id && !equipmentFits(eq, { ...zone, w: newW, h: newH }, placedEquipment))) return zone;
      const newAreaPercent = (newW / 100) * (newH / 100);
      const totalZoneAreaPercent = prev.reduce((sum, z) => {
        if (z.id === zone.id) return sum + newAreaPercent;
        return sum + (z.w / 100) * (z.h / 100);
      }, 0);
      if (totalZoneAreaPercent > 1.00001) return zone;
      return { ...zone, w: newW, h: newH, area_m2: Math.round(newAreaPercent * totalAreaNum * 100) / 100 };
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [dragging, dragStart, totalArea, placedEquipment]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handleMouseMove);
      window.addEventListener('pointerup', handleMouseUp);
      window.addEventListener('pointercancel', handleMouseUp);
      window.addEventListener('blur', handleMouseUp);
      return () => {
        window.removeEventListener('pointermove', handleMouseMove);
        window.removeEventListener('pointerup', handleMouseUp);
        window.removeEventListener('pointercancel', handleMouseUp);
        window.removeEventListener('blur', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const resizeZone = (zoneId: string, deltaW: number, deltaH: number) => {
    const next = zones.map(zone => {
      if (zone.id !== zoneId) return zone;
      const w = Math.max(1, Math.min(100 - zone.x, zone.w + deltaW));
      const h = Math.max(1, Math.min(100 - zone.y, zone.h + deltaH));
      return { ...zone, w, h, area_m2: w * h * Number(totalArea) / 10000 };
    });
    if (validProjectGeometry({ total_area: Number(totalArea), length_m: Number(lengthM), width_m: Number(widthM), zones: next }) && placedEquipment.every(eq => {
      const zone = next.find(item => item.id === eq.zoneId);
      return zone && equipmentFits(eq, zone, placedEquipment);
    })) { setZones(next); setSaved(false); setSaveError(''); }
    else setSaveError('Zona nu poate fi redimensionată: verifică limitele, suprapunerile și echipamentele.');
  };

  // Save project
  const handleSave = async () => {
    if (pendingRequirements) { setSaveError('Aplică o propunere sau renunță la cerințele neaplicate înainte de salvare.'); return; }
    if (!validStudioProject({ total_area: Number(totalArea), length_m: Number(lengthM), width_m: Number(widthM), configuration: legacyConfiguration ? null : configuration, zones: zones.map(z => ({ ...z, equipment: placedEquipment.filter(e => e.zoneId === z.id) })) })) { setSaveError('Bugetul sau înălțimea nu corespund machetelor din plan.'); return; }
    setSaving(true); setSaved(false); setSaveError('');
    try {
      const res = await fetch('/api/gym-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: projectId || undefined,
          name: projectName,
          variant,
          total_area: Number(totalArea),
          length_m: Number(lengthM),
          width_m: Number(widthM),
          zones: zones.map(z => ({ ...z, equipment: placedEquipment.filter(e => e.zoneId === z.id) })),
          status: 'draft',
          configuration: legacyConfiguration ? null : configuration,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjectId(data.project.id); setPreviousDesign(null);
        setProjects(previous => [data.project, ...previous.filter(project => project.id !== data.project.id)]);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else { const data = await res.json(); throw new Error(res.status === 401 ? 'Autentifică-te pentru a salva proiectul.' : data.error || 'Proiectul nu a putut fi salvat.'); }
    } catch (error) { setSaveError(error instanceof Error ? error.message : 'Eroare de conexiune.'); }
    finally { setSaving(false); }
  };

  // Calculate total allocated area
  const totalAllocated = zones.reduce((sum, z) => sum + z.area_m2, 0);
  const totalAreaNum = Number(totalArea) || 0;
  const overBudget = totalAllocated > totalAreaNum * 1.01;

  // Filter equipment catalog
  const filteredCatalog = equipmentFilter === 'all'
    ? EQUIPMENT_CATALOG
    : EQUIPMENT_CATALOG.filter(e => e.zone === equipmentFilter);

  // Get zone color for equipment
  const getZoneColor = (zoneId: string) => {
    return ZONE_DEFINITIONS.find(z => z.id === zoneId)?.color || '#666';
  };

  if (wantedProject && projectLinkError) return <main className="min-h-screen p-8 space-y-4"><p role="alert">{ui(projectLinkError)}</p><Link className="btn-primary inline-flex" href={loginHref(`/configurator/classic?id=${encodeURIComponent(wantedProject)}`)}>{ui('Autentificare')}</Link><Link className="btn-secondary inline-flex" href="/client/dashboard#proiecte">{ui('Proiectele mele')}</Link></main>;
  if (wantedProject && !projectId) return <main className="min-h-screen p-8"><p role="status">{ui('Se încarcă proiectele…')}</p></main>;
  return (
    <main className="min-h-screen bg-anthracite-950" aria-busy={saving}>
      {saving && <p role="status" className="fixed z-50 bottom-4 left-4 rounded-lg bg-anthracite-800 p-3 text-white">{ui('Se salvează...')}</p>}
      <div inert={saving} className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-28">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-anthracite-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {ui("Înapoi")}</button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-gold-400" />
              {ui("Gym Builder")}</h1><a href="/configurator/studio" className="btn-primary mt-3 inline-flex">{ui("Deschide editorul spațiului")}</a>
          </div>
        </div>

        {saveError && <p role="alert" className="text-red-400 mb-4">{ui(saveError)}</p>}
        {projects.length > 0 && <div className="mb-6"><label htmlFor="saved-project">{ui("Deschide un proiect salvat")}</label><select id="saved-project" className="input-field mt-2" value={projectId || ''} onChange={event => openProject(event.target.value)}><option value="" disabled>{ui("Alege proiectul")}</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></div>}
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-gold-400 text-anthracite-950' : 'bg-anthracite-800 text-anthracite-400'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${step >= s ? 'text-white' : 'text-anthracite-500'}`}>
                {ui(s === 1 ? 'Variantă' : s === 2 ? 'Spațiu' : 'Zone & Echipamente')}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-gold-400' : 'bg-anthracite-700'}`} />}
            </div>
          ))}
        </div>

        {previousDesign && <button className="btn-secondary mb-4 min-h-11" onClick={restoreDesign}>{ui('Revenire la planul anterior')}</button>}
        {/* Step 1: Choose Variant */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">{ui("Alege varianta de configurare")}</h2>
              <p className="text-anthracite-400 text-sm">{ui("Cum dorești să îți configurezi sala?")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setVariant('plan_existing')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  variant === 'plan_existing'
                    ? 'border-gold-400 bg-gold-400/5'
                    : 'border-anthracite-700 bg-anthracite-800/50 hover:border-anthracite-500'
                }`}
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                  <LayoutGrid className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{ui("Am deja plan de sală")}</h3>
                <p className="text-anthracite-400 text-sm">
                  {ui("Introduci manual suprafețele pe zone, bazat pe planul tău existent.")}</p>
              </button>

              <button
                onClick={() => setVariant('from_scratch')}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  variant === 'from_scratch'
                    ? 'border-gold-400 bg-gold-400/5'
                    : 'border-anthracite-700 bg-anthracite-800/50 hover:border-anthracite-500'
                }`}
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Dumbbell className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{ui("Vreau să încep de la zero")}</h3>
                <p className="text-anthracite-400 text-sm">
                  {ui("Definești spațiul și alegi zonele, apoi generezi o propunere cu machete standard.")}</p>
              </button>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                disabled={!variant}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ui("Continuă ")}<ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Define Space */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">{ui("Definește spațiul")}</h2>
              <p className="text-anthracite-400 text-sm">{ui("Introdu dimensiunile sălii tale")}</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label htmlFor="field-dashboardconfigurator-25087" className="block text-sm font-medium text-anthracite-300 mb-2">{ui("Nume Proiect")}</label>
                <input id="field-dashboardconfigurator-25087"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input-field"
                  placeholder="ex: Sala Fitness Central"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="field-dashboardconfigurator-25586" className="block text-sm font-medium text-anthracite-300 mb-2">{ui("Suprafață Totală (m²)")}</label>
                  <input id="field-dashboardconfigurator-25586"
                    type="number"
                    value={totalArea}
                    onChange={(e) => setTotalArea(e.target.value)}
                    className="input-field"
                    placeholder="ex: 500"
                    min="0.01" step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="field-dashboardconfigurator-26049" className="block text-sm font-medium text-anthracite-300 mb-2">{ui("Lungime (m)")}</label>
                  <input id="field-dashboardconfigurator-26049"
                    type="number"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    className="input-field"
                    placeholder="ex: 25"
                    min="0.01" step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="field-dashboardconfigurator-26496" className="block text-sm font-medium text-anthracite-300 mb-2">{ui("Lățime (m)")}</label>
                  <input id="field-dashboardconfigurator-26496"
                    type="number"
                    value={widthM}
                    onChange={(e) => setWidthM(e.target.value)}
                    className="input-field"
                    placeholder="ex: 20"
                    min="0.01" step="0.01"
                  />
                </div>
              </div>

        {step === 2 && <div className="mb-6"><GymDesignAssistant
          draft={{ ...requirementsDraft, length_m: Number(lengthM) || null, width_m: Number(widthM) || null, total_area: Number(totalArea) || null }}
          onChange={setRequirementsDraft} onApply={applyDesign}
        /></div>}
              {variant === 'plan_existing' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-anthracite-300">
                      {ui("Opțional: introdu suprafața estimată per zonă (m²)")}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ZONE_DEFINITIONS.map((def) => (
                      <div key={def.id} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: def.color }} />
                        <span className="text-sm text-anthracite-300 flex-1 min-w-0 truncate">{ui(def.name)}</span>
                        <input
                          type="number"
                          value={customZoneAreas[def.id] || ''}
                          onChange={(e) => setCustomZoneAreas(prev => ({ ...prev, [def.id]: e.target.value }))}
                          className="w-20 bg-anthracite-800 border border-anthracite-600 rounded-lg px-2 py-1.5 text-sm text-white text-right"
                          placeholder={ui(`${Math.round((def.defaultPercent / 100) * Number(totalArea || 0))}`)}
                          min="0"
                        />
                        <span className="text-xs text-anthracite-500">m²</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}


            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {ui("Înapoi")}</button>
              <button
                onClick={goToStep3}
                disabled={!canProceedStep2}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ui("Deschide editorul fără machete")}<ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Zone Editor + Equipment Library */}
        {step === 3 && (
          <div className="space-y-6">
            <details className="rounded-xl border border-anthracite-700 bg-anthracite-900 p-4"><summary className="cursor-pointer min-h-11 text-white font-medium">{ui('Cerințe și asistent AI')}</summary><GymDesignAssistant draft={{ ...requirementsDraft, length_m: Number(lengthM) || null, width_m: Number(widthM) || null, total_area: Number(totalArea) || null }} onChange={setRequirementsDraft} onApply={applyDesign} /></details>
            {legacyConfiguration && <p className="text-sm text-amber-200">{ui('Proiect vechi: înălțimea și bugetul nu sunt înregistrate. Completează cerințele și aplică o propunere pentru noul format.')}</p>}
            {pendingRequirements && <div role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100"><p>{ui('Cerințele modificate nu sunt aplicate planului. Generează și aplică o propunere înainte de salvare.')}</p><button className="btn-secondary mt-3 min-h-11" onClick={() => setRequirementsDraft(configuration)}>{ui('Renunță la cerințele neaplicate')}</button></div>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl border border-anthracite-700 bg-anthracite-900 p-3 text-white">{lengthM} × {widthM} × {legacyConfiguration ? '—' : configuration.height_m} m<p className="text-anthracite-400 mt-1">{ui('Dimensiuni spațiu')}</p></div>
              <div className="rounded-xl border border-anthracite-700 bg-anthracite-900 p-3 text-white">{placedEquipment.length}<p className="text-anthracite-400 mt-1">{ui('machete standard')}</p></div>
              <div className="rounded-xl border border-anthracite-700 bg-anthracite-900 p-3 text-white">€{equipmentCost(placedEquipment).toLocaleString(locale)}<p className="text-anthracite-400 mt-1">{ui('Cost estimativ dotări')}</p></div>
              <div className="rounded-xl border border-anthracite-700 bg-anthracite-900 p-3 text-white">{configuration.budget_eur === null ? ui('Fără plafon') : `€${Math.max(0, configuration.budget_eur - equipmentCost(placedEquipment)).toLocaleString(locale)}`}<p className="text-anthracite-400 mt-1">{ui('Buget rămas')}</p></div>
            </div>
            <p className="text-xs text-anthracite-400">{ui('Costuri indicative pentru machete, fără lucrări, chirie, instalații sau taxe. Rezerva de circulație nu este un traseu de evacuare validat.')}</p>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{ui("Zone & Echipamente")}</h2>
                <p className="text-anthracite-400 text-sm flex items-center gap-2">
                  <Move className="w-3.5 h-3.5" />
                  {ui("Machete standard la scară reală · plan 2D și scenă 3D")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                  overBudget
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {ui(totalAllocated.toFixed(0))} / {totalAreaNum} m²
                </div>
                <button
                  onClick={() => setShowLibrary(!showLibrary)}
                  className={`flex min-h-11 items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showLibrary ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-anthracite-800 text-anthracite-300 border border-anthracite-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  {ui("Bibliotecă")}</button>
                <button
                  onClick={handleSave}
                  disabled={saving || pendingRequirements}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {ui(saving ? 'Se salvează...' : saved ? 'Salvat!' : 'Salvează')}
                </button>
              </div>
            </div>

            {overBudget && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
                {ui("⚠️ Suma zonelor depășește suprafața totală. Redimensionează zonele.")}</div>
            )}

            <div className={`grid gap-4 ${showLibrary ? 'grid-cols-1 lg:grid-cols-[1fr_280px]' : 'grid-cols-1'}`}>
              {/* 3D Plan */}
              <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 overflow-hidden">
                <div className="mb-2 flex items-center gap-2 text-xs text-anthracite-400">
                  <Info className="w-3.5 h-3.5" />
                  {planMode === '2d' ? ui("Selectează echipamentele din listă și folosește butoanele de mutare sau trage pe plan. Cu tastatura: săgeți și Delete.") : ui("Rotește: trage cu un deget sau mouse-ul · Zoom: două degete sau scroll · Pan: două degete sau click dreapta")}</div>
                <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={ui('Mod plan')}>
                  <button className="btn-secondary min-h-11 py-2 px-3" aria-pressed={planMode === '2d'} onClick={() => setPlanMode('2d')}>{ui('Plan 2D')}</button>
                  <button className="btn-secondary min-h-11 py-2 px-3" aria-pressed={planMode === '3d'} onClick={() => setPlanMode('3d')}>{ui('Previzualizare 3D')}</button>
                </div>
                {planMode === '3d' ? <GymScene3D
                  lengthM={Number(lengthM) || 20} widthM={Number(widthM) || 15} heightM={configuration.height_m}
                  zones={zones.map(zone => ({ id: zone.id, name: zone.name, color: zone.color, x: zone.x, y: zone.y, width: zone.w, height: zone.h, area: zone.area_m2 }))}
                  equipment={placedEquipment}
                  selectedEquipment={selectedEquipment}
                  onSelectEquipment={setSelectedEquipment}
                  onMoveEquipment={moveEquipment3D}
                /> : <div className="max-h-[650px] overflow-auto rounded-xl border border-anthracite-600">
                  <svg ref={svgRef} role="group" aria-label={ui('Plan 2D al sălii')} viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full block bg-anthracite-900" style={{ aspectRatio: `${Number(lengthM)}/${Number(widthM)}`, touchAction: 'none' }}>
                    {zones.map(zone => <g key={zone.id}>
                      <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} fill={zone.color} fillOpacity={0.2} stroke={zone.color} strokeWidth={0.2} />
                      <text x={zone.x + 0.8} y={zone.y + 2.5} fontSize={1.8} fill="white" pointerEvents="none">{ui(zone.name)}</text>
                      <circle role="button" tabIndex={0} aria-label={`${ui('Redimensionează zona')} ${ui(zone.name)}`} cx={zone.x + zone.w} cy={zone.y + zone.h} r={1} fill="white" stroke={zone.color} strokeWidth={0.3}
                        onPointerDown={event => handleZonePointerDown(event, zone.id, 'right-bottom')}
                        onKeyDown={event => {
                          const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 0.5 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -0.5 : 0;
                          if (!delta) return; event.preventDefault();
                          resizeZone(zone.id, event.key.includes('Right') || event.key.includes('Left') ? delta : 0, event.key.includes('Down') || event.key.includes('Up') ? delta : 0);
                        }} />
                    </g>)}
                    {placedEquipment.map(eq => <g key={eq.instanceId} role="button" tabIndex={0} aria-label={`${ui(eq.name)} ${eq.length_m}m × ${eq.width_m}m`} aria-pressed={selectedEquipment === eq.instanceId}
                      onPointerDown={event => handleEquipPointerDown(event, eq.instanceId)} onFocus={() => setSelectedEquipment(eq.instanceId)}
                      onKeyDown={event => { const delta: Record<string, [number, number]> = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, -0.5], ArrowDown: [0, 0.5] }; if (delta[event.key]) { event.preventDefault(); moveEquipment(eq.instanceId, ...delta[event.key]); } else if (event.key === 'Delete') removeEquipment(eq.instanceId); }}>
                      <rect x={eq.x} y={eq.y} width={eq.w} height={eq.h} rx={0.4} fill={selectedEquipment === eq.instanceId ? '#e8b811' : '#e4e4e7'} stroke="#141418" strokeWidth={0.25} />
                      <text x={eq.x + eq.w / 2} y={eq.y + eq.h / 2} fontSize={1.1} textAnchor="middle" dominantBaseline="central" fill="#141418" pointerEvents="none">{ui(eq.name)}</text>
                    </g>)}
                  </svg>
                </div>}


                {planMode === '2d' && <div className="mt-4 space-y-3">
                  <label htmlFor="resize-zone" className="block text-sm text-anthracite-200">{ui('Redimensionează zona')}</label>
                  <select id="resize-zone" className="input-field" value={selectedZone} onChange={event => setSelectedZone(event.target.value)}>{zones.map(zone => <option key={zone.id} value={zone.id}>{ui(zone.name)}</option>)}</select>
                  <div className="grid grid-cols-2 gap-2">
                    {([{ label: 'Micșorează lățimea zonei', w: -0.5, h: 0, text: 'Lățime −' }, { label: 'Mărește lățimea zonei', w: 0.5, h: 0, text: 'Lățime +' }, { label: 'Micșorează înălțimea zonei', w: 0, h: -0.5, text: 'Înălțime −' }, { label: 'Mărește înălțimea zonei', w: 0, h: 0.5, text: 'Înălțime +' }]).map(control => <button key={control.label} aria-label={ui(control.label)} className="min-h-11 px-2 rounded-lg border border-anthracite-600 text-sm text-white" onClick={() => resizeZone(selectedZone, control.w, control.h)}>{ui(control.text)}</button>)}
                  </div>
                </div>}

                {planMode === '3d' && <p className="text-xs text-anthracite-300 mt-3">{ui('Mutare în 3D: selectează modelul și trage săgețile. Pas: 10 cm.')}</p>}
                {/* Selected equipment info bar */}
                {selectedEquipment && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-anthracite-900 border border-anthracite-600 rounded-lg px-3 py-2">
                    <span className="text-sm text-white font-medium">
                      {ui(placedEquipment.find(e => e.instanceId === selectedEquipment)?.name)}
                      <span className="text-anthracite-400 ml-2">
                        ({placedEquipment.find(e => e.instanceId === selectedEquipment)?.length_m}m × {placedEquipment.find(e => e.instanceId === selectedEquipment)?.width_m}m)
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={ui('Mută echipamentul')}>
                      {([{ label: 'Mută la stânga', x: -0.5, y: 0, icon: '←' }, { label: 'Mută în sus', x: 0, y: -0.5, icon: '↑' }, { label: 'Mută în jos', x: 0, y: 0.5, icon: '↓' }, { label: 'Mută la dreapta', x: 0.5, y: 0, icon: '→' }]).map(direction => (
                        <button key={direction.label} aria-label={ui(direction.label)} className="min-h-11 min-w-11 rounded-lg border border-anthracite-600 text-white" onClick={() => moveEquipment(selectedEquipment, direction.x, direction.y)}>{direction.icon}</button>
                      ))}
                    </div>
                    <button className="btn-secondary min-h-11" onClick={() => rotateEquipment(selectedEquipment)}>{ui('Rotește 90°')}</button>
                    <button
                      onClick={() => removeEquipment(selectedEquipment)}
                      className="min-h-11 px-2 flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {ui("Șterge")}</button>
                  </div>
                )}
              </div>

              {/* Equipment Library Sidebar */}
              {showLibrary && (
                <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold-400" />
                    {ui("Bibliotecă Echipamente")}</h3>

                  {/* Zone filter */}
                  <select
                    value={equipmentFilter}
                    onChange={(e) => setEquipmentFilter(e.target.value)}
                    aria-label={ui("Filtrează echipamentele după zonă")} className="w-full min-h-11 bg-anthracite-900 border border-anthracite-600 rounded-lg px-2 py-2 text-base sm:text-sm text-anthracite-200 mb-3"
                  >
                    <option value="all">{ui("Toate zonele")}</option>
                    {ZONE_DEFINITIONS.map(z => (
                      <option key={z.id} value={z.id}>{ui(z.name)}</option>
                    ))}
                  </select>

                  {/* Equipment list */}
                  <div className="space-y-1.5">
                    {filteredCatalog.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => addEquipmentToZone(template)}
                        className="w-full min-h-11 text-left p-2 rounded-lg bg-anthracite-900/50 border border-anthracite-700 hover:border-anthracite-500 hover:bg-anthracite-700/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: getZoneColor(template.zone) }} />
                          <span className="text-xs font-medium text-white group-hover:text-gold-400 transition-colors truncate">
                            {ui(template.name)}
                          </span>
                        </div>
                        <p className="text-[10px] text-anthracite-400 mt-0.5 ml-4">
                          {ui(template.length_m)}m × {ui(template.width_m)}m · {template.height_m}m ↑ · €{template.price_eur} · {ui(ZONE_DEFINITIONS.find(z => z.id === template.zone)?.name)}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-anthracite-700">
                    <p className="text-[10px] text-anthracite-500">
                      {ui("Click pe un echipament pentru a-l adăuga în zona corespunzătoare. Apoi trage-l pe plan pentru a-l poziționa.")}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Zone Legend + Placed Equipment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">{ui("Legendă Zone")}</h3><p className="text-xs text-anthracite-300 mb-3">{ui('Spațiu nealocat')}: {Math.max(0, totalAreaNum - totalAllocated).toFixed(1)} m²</p>
                <div className="grid grid-cols-2 gap-2">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: zone.color }} />
                      <span className="text-xs text-anthracite-300 truncate">{ui(zone.name)}</span>
                      <span className="text-xs text-anthracite-500 ml-auto">{zone.area_m2.toFixed(1)} m²</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  {ui("Echipamente Plasate (")}{placedEquipment.length})
                </h3>
                {placedEquipment.length === 0 ? (
                  <p className="text-xs text-anthracite-500">
                    {ui("Niciun echipament plasat. Adaugă din bibliotecă.")}</p>
                ) : (
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {placedEquipment.map((eq) => (
                      <div key={eq.instanceId} className="flex items-center gap-2 group">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: getZoneColor(eq.zoneId) }} />
                        <button className="min-h-11 min-w-0 text-left text-sm text-anthracite-300 truncate flex-1" aria-pressed={selectedEquipment === eq.instanceId} onClick={() => setSelectedEquipment(eq.instanceId)}>{ui(eq.name)}</button>
                        <button
                          onClick={() => removeEquipment(eq.instanceId)}
                          aria-label={`${ui("Elimină din plan")} ${ui(eq.name)}`} className="min-h-11 min-w-11 flex items-center justify-center text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap gap-3 justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {ui("Înapoi")}</button>
              <button
                onClick={handleSave}
                disabled={saving || overBudget || pendingRequirements}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {ui(saving ? 'Se salvează...' : 'Salvează Proiect')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
