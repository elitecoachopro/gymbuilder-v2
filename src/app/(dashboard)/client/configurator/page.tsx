'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Dumbbell, LayoutGrid, Move, Save, Loader2, Info, Package, Trash2, GripVertical } from 'lucide-react';

// Zone definitions with colors
const ZONE_DEFINITIONS = [
  { id: 'receptie', name: 'Recepție', color: '#F59E0B', defaultPercent: 5 },
  { id: 'vestiare', name: 'Vestiare', color: '#8B5CF6', defaultPercent: 12 },
  { id: 'cardio', name: 'Cardio', color: '#EF4444', defaultPercent: 15 },
  { id: 'greutati', name: 'Greutăți Libere', color: '#3B82F6', defaultPercent: 15 },
  { id: 'aparate', name: 'Aparate Forță', color: '#10B981', defaultPercent: 15 },
  { id: 'functional', name: 'Functional/Crossfit', color: '#F97316', defaultPercent: 12 },
  { id: 'studio', name: 'Studio', color: '#EC4899', defaultPercent: 8 },
  { id: 'stretching', name: 'Stretching', color: '#06B6D4', defaultPercent: 6 },
  { id: 'spa', name: 'Spa', color: '#84CC16', defaultPercent: 7 },
  { id: 'lounge', name: 'Lounge', color: '#A855F7', defaultPercent: 5 },
];

// Equipment catalog - 18 items grouped by zone
interface EquipmentTemplate {
  id: string;
  name: string;
  zone: string;
  width_m: number;  // real width in meters
  length_m: number; // real length in meters
  label: string;    // display label with dimensions
}

const EQUIPMENT_CATALOG: EquipmentTemplate[] = [
  // Cardio (3)
  { id: 'banda_alergare', name: 'Bandă Alergare', zone: 'cardio', length_m: 2.0, width_m: 0.8, label: 'Bandă alergare — 2m × 0.8m' },
  { id: 'bicicleta_spinning', name: 'Bicicletă Spinning', zone: 'cardio', length_m: 1.2, width_m: 0.6, label: 'Bicicletă spinning — 1.2m × 0.6m' },
  { id: 'eliptica', name: 'Eliptică', zone: 'cardio', length_m: 1.8, width_m: 0.7, label: 'Eliptică — 1.8m × 0.7m' },
  // Greutăți Libere (3)
  { id: 'rack_squat', name: 'Rack Squat', zone: 'greutati', length_m: 1.2, width_m: 1.2, label: 'Rack Squat — 1.2m × 1.2m' },
  { id: 'banca_reglabila', name: 'Bancă Reglabilă', zone: 'greutati', length_m: 1.2, width_m: 0.5, label: 'Bancă reglabilă — 1.2m × 0.5m' },
  { id: 'suport_gantere', name: 'Suport Gantere', zone: 'greutati', length_m: 2.0, width_m: 0.6, label: 'Suport gantere — 2m × 0.6m' },
  // Aparate Forță (3)
  { id: 'aparat_piept', name: 'Aparat Piept (Chest Press)', zone: 'aparate', length_m: 1.5, width_m: 1.2, label: 'Chest Press — 1.5m × 1.2m' },
  { id: 'aparat_picioare', name: 'Aparat Picioare (Leg Press)', zone: 'aparate', length_m: 2.2, width_m: 1.0, label: 'Leg Press — 2.2m × 1m' },
  { id: 'aparat_lat', name: 'Lat Pulldown', zone: 'aparate', length_m: 1.4, width_m: 1.0, label: 'Lat Pulldown — 1.4m × 1m' },
  // Functional/Crossfit (3)
  { id: 'rig_crossfit', name: 'Rig Crossfit', zone: 'functional', length_m: 3.0, width_m: 1.8, label: 'Rig Crossfit — 3m × 1.8m' },
  { id: 'box_pliometric', name: 'Box Pliometric', zone: 'functional', length_m: 0.6, width_m: 0.5, label: 'Box pliometric — 0.6m × 0.5m' },
  { id: 'rowing_machine', name: 'Rowing Machine', zone: 'functional', length_m: 2.4, width_m: 0.6, label: 'Rowing machine — 2.4m × 0.6m' },
  // Studio (2)
  { id: 'oglinda_perete', name: 'Oglindă Perete', zone: 'studio', length_m: 2.0, width_m: 0.1, label: 'Oglindă perete — 2m × 0.1m' },
  { id: 'saltea_yoga', name: 'Saltea Yoga', zone: 'studio', length_m: 1.8, width_m: 0.6, label: 'Saltea yoga — 1.8m × 0.6m' },
  // Spa (2)
  { id: 'sauna', name: 'Cabină Saună', zone: 'spa', length_m: 2.0, width_m: 2.0, label: 'Cabină saună — 2m × 2m' },
  { id: 'jacuzzi', name: 'Jacuzzi', zone: 'spa', length_m: 2.2, width_m: 2.2, label: 'Jacuzzi — 2.2m × 2.2m' },
  // Recepție (2)
  { id: 'desk_receptie', name: 'Desk Recepție', zone: 'receptie', length_m: 2.0, width_m: 0.7, label: 'Desk recepție — 2m × 0.7m' },
  { id: 'canapea', name: 'Canapea Așteptare', zone: 'receptie', length_m: 1.8, width_m: 0.8, label: 'Canapea — 1.8m × 0.8m' },
  // Vestiare (2) - intentionally not in the "stretching" zone since stretching uses studio items
  { id: 'dulap_vestiar', name: 'Dulap Vestiar (x5)', zone: 'vestiare', length_m: 2.5, width_m: 0.5, label: 'Dulapuri vestiar (5) — 2.5m × 0.5m' },
  { id: 'banca_vestiar', name: 'Bancă Vestiar', zone: 'vestiare', length_m: 1.5, width_m: 0.4, label: 'Bancă vestiar — 1.5m × 0.4m' },
];

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

interface PlacedEquipment {
  instanceId: string;
  templateId: string;
  name: string;
  zoneId: string;
  x: number; // percentage within SVG viewBox (0-100)
  y: number;
  w: number; // percentage width in SVG
  h: number; // percentage height in SVG
  width_m: number;
  length_m: number;
}

export default function GymConfigurator() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [variant, setVariant] = useState<'plan_existing' | 'from_scratch' | null>(null);
  const [totalArea, setTotalArea] = useState('');
  const [lengthM, setLengthM] = useState('');
  const [widthM, setWidthM] = useState('');
  const [customZoneAreas, setCustomZoneAreas] = useState<Record<string, string>>({});
  const [zones, setZones] = useState<Zone[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Proiect Sală');

  // Equipment state
  const [placedEquipment, setPlacedEquipment] = useState<PlacedEquipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [showLibrary, setShowLibrary] = useState(true);

  // SVG drag state
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ zoneId: string; edge: 'right' | 'bottom' | 'right-bottom' } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Equipment drag state
  const [draggingEquipment, setDraggingEquipment] = useState<{ instanceId: string } | null>(null);
  const [equipDragStart, setEquipDragStart] = useState<{ x: number; y: number } | null>(null);

  const canProceedStep2 = totalArea && lengthM && widthM && Number(totalArea) > 0 && Number(lengthM) > 0 && Number(widthM) > 0;

  // Generate zones layout from percentages
  const generateZones = useCallback(() => {
    const total = Number(totalArea);
    const length = Number(lengthM);
    const width = Number(widthM);
    if (!total || !length || !width) return;

    let zoneList: Zone[] = [];
    let currentX = 0;
    let currentY = 0;
    let rowHeight = 0;
    const maxCols = 3;
    let col = 0;

    ZONE_DEFINITIONS.forEach((def) => {
      let areaM2: number;
      if (variant === 'plan_existing' && customZoneAreas[def.id]) {
        areaM2 = Number(customZoneAreas[def.id]);
      } else {
        areaM2 = (def.defaultPercent / 100) * total;
      }

      const areaPercent = areaM2 / total;
      const zoneW = 100 / maxCols;
      const zoneH = (areaPercent * 100) / (zoneW / 100);

      if (col >= maxCols) {
        currentX = 0;
        currentY += rowHeight;
        col = 0;
        rowHeight = 0;
      }

      const zone: Zone = {
        id: def.id,
        name: def.name,
        color: def.color,
        x: currentX,
        y: currentY,
        w: zoneW,
        h: Math.max(zoneH, 8),
        area_m2: Math.round(areaM2 * 100) / 100,
      };

      rowHeight = Math.max(rowHeight, zone.h);
      currentX += zoneW;
      col++;
      zoneList.push(zone);
    });

    const totalHeight = currentY + rowHeight;
    if (totalHeight > 100) {
      const scale = 100 / totalHeight;
      zoneList = zoneList.map(z => ({
        ...z,
        y: z.y * scale,
        h: z.h * scale,
      }));
    }

    setZones(zoneList);
  }, [totalArea, lengthM, widthM, variant, customZoneAreas]);

  const goToStep3 = () => {
    generateZones();
    setStep(3);
  };

  // Convert real meters to SVG percentage units
  const metersToSvgPercent = useCallback((meters: number, axis: 'x' | 'y') => {
    const totalM = axis === 'x' ? Number(lengthM) : Number(widthM);
    if (!totalM) return 5;
    return (meters / totalM) * 100;
  }, [lengthM, widthM]);

  // Add equipment from library to a zone
  const addEquipmentToZone = (template: EquipmentTemplate) => {
    const targetZone = zones.find(z => z.id === template.zone);
    if (!targetZone) return;

    const eqW = metersToSvgPercent(template.length_m, 'x');
    const eqH = metersToSvgPercent(template.width_m, 'y');

    // Place in center of the target zone
    const newEquip: PlacedEquipment = {
      instanceId: `${template.id}_${Date.now()}`,
      templateId: template.id,
      name: template.name,
      zoneId: template.zone,
      x: targetZone.x + (targetZone.w - eqW) / 2,
      y: targetZone.y + (targetZone.h - eqH) / 2,
      w: eqW,
      h: eqH,
      width_m: template.width_m,
      length_m: template.length_m,
    };

    setPlacedEquipment(prev => [...prev, newEquip]);
  };

  // Remove placed equipment
  const removeEquipment = (instanceId: string) => {
    setPlacedEquipment(prev => prev.filter(e => e.instanceId !== instanceId));
    if (selectedEquipment === instanceId) setSelectedEquipment(null);
  };

  // Equipment drag handlers
  const handleEquipMouseDown = (e: React.MouseEvent, instanceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingEquipment({ instanceId });
    setEquipDragStart({ x: e.clientX, y: e.clientY });
    setSelectedEquipment(instanceId);
  };

  const handleEquipMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingEquipment || !equipDragStart || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - equipDragStart.x) / svgRect.width) * 100;
    const deltaYPercent = ((e.clientY - equipDragStart.y) / svgRect.height) * 100;

    setPlacedEquipment(prev => prev.map(eq => {
      if (eq.instanceId !== draggingEquipment.instanceId) return eq;
      const newX = Math.max(0, Math.min(100 - eq.w, eq.x + deltaXPercent));
      const newY = Math.max(0, Math.min(100 - eq.h, eq.y + deltaYPercent));
      return { ...eq, x: newX, y: newY };
    }));

    setEquipDragStart({ x: e.clientX, y: e.clientY });
  }, [draggingEquipment, equipDragStart]);

  const handleEquipMouseUp = useCallback(() => {
    setDraggingEquipment(null);
    setEquipDragStart(null);
  }, []);

  useEffect(() => {
    if (draggingEquipment) {
      window.addEventListener('mousemove', handleEquipMouseMove);
      window.addEventListener('mouseup', handleEquipMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleEquipMouseMove);
        window.removeEventListener('mouseup', handleEquipMouseUp);
      };
    }
  }, [draggingEquipment, handleEquipMouseMove, handleEquipMouseUp]);

  // Zone resize handlers
  const handleMouseDown = (e: React.MouseEvent, zoneId: string, edge: 'right' | 'bottom' | 'right-bottom') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({ zoneId, edge });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !dragStart || !svgRef.current) return;

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
      const newAreaPercent = (newW / 100) * (newH / 100);
      const totalZoneAreaPercent = prev.reduce((sum, z) => {
        if (z.id === zone.id) return sum + newAreaPercent;
        return sum + (z.w / 100) * (z.h / 100);
      }, 0);
      if (totalZoneAreaPercent > 1.05) return zone;
      return { ...zone, w: newW, h: newH, area_m2: Math.round(newAreaPercent * totalAreaNum * 100) / 100 };
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [dragging, dragStart, totalArea]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Touch handlers for zone resize
  const handleTouchStart = (e: React.TouchEvent, zoneId: string, edge: 'right' | 'bottom' | 'right-bottom') => {
    e.stopPropagation();
    const touch = e.touches[0];
    setDragging({ zoneId, edge });
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    if (!dragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStart || !svgRef.current) return;
      const touch = e.touches[0];
      const svgRect = svgRef.current.getBoundingClientRect();
      const deltaXPercent = ((touch.clientX - dragStart.x) / svgRect.width) * 100;
      const deltaYPercent = ((touch.clientY - dragStart.y) / svgRect.height) * 100;
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
        const newAreaPercent = (newW / 100) * (newH / 100);
        return { ...zone, w: newW, h: newH, area_m2: Math.round(newAreaPercent * totalAreaNum * 100) / 100 };
      }));
      setDragStart({ x: touch.clientX, y: touch.clientY });
    };
    const handleTouchEnd = () => { setDragging(null); setDragStart(null); };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => { window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('touchend', handleTouchEnd); };
  }, [dragging, dragStart, totalArea]);

  // Touch handlers for equipment drag
  const handleEquipTouchStart = (e: React.TouchEvent, instanceId: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setDraggingEquipment({ instanceId });
    setEquipDragStart({ x: touch.clientX, y: touch.clientY });
    setSelectedEquipment(instanceId);
  };

  useEffect(() => {
    if (!draggingEquipment) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (!equipDragStart || !svgRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const svgRect = svgRef.current.getBoundingClientRect();
      const deltaXPercent = ((touch.clientX - equipDragStart.x) / svgRect.width) * 100;
      const deltaYPercent = ((touch.clientY - equipDragStart.y) / svgRect.height) * 100;
      setPlacedEquipment(prev => prev.map(eq => {
        if (eq.instanceId !== draggingEquipment.instanceId) return eq;
        const newX = Math.max(0, Math.min(100 - eq.w, eq.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - eq.h, eq.y + deltaYPercent));
        return { ...eq, x: newX, y: newY };
      }));
      setEquipDragStart({ x: touch.clientX, y: touch.clientY });
    };
    const handleTouchEnd = () => { setDraggingEquipment(null); setEquipDragStart(null); };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => { window.removeEventListener('touchmove', handleTouchMove); window.removeEventListener('touchend', handleTouchEnd); };
  }, [draggingEquipment, equipDragStart]);

  // Save project
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/client/gym-projects', {
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
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjectId(data.project.id);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
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

  return (
    <main className="min-h-screen bg-anthracite-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/client/dashboard"
            className="flex items-center gap-2 text-anthracite-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-gold-400" />
              Configurator de Sală
            </h1>
          </div>
        </div>

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
                {s === 1 ? 'Variantă' : s === 2 ? 'Spațiu' : 'Zone & Echipamente'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-gold-400' : 'bg-anthracite-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Choose Variant */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Alege varianta de configurare</h2>
              <p className="text-anthracite-400 text-sm">Cum dorești să îți configurezi sala?</p>
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
                <h3 className="text-white font-semibold mb-2">Am deja plan de sală</h3>
                <p className="text-anthracite-400 text-sm">
                  Introduci manual suprafețele pe zone, bazat pe planul tău existent.
                </p>
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
                <h3 className="text-white font-semibold mb-2">Vreau să încep de la zero</h3>
                <p className="text-anthracite-400 text-sm">
                  Sistemul propune o împărțire proporțională pe cele 10 zone standard.
                </p>
              </button>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                disabled={!variant}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuă <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Define Space */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-white mb-2">Definește spațiul</h2>
              <p className="text-anthracite-400 text-sm">Introdu dimensiunile sălii tale</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-anthracite-300 mb-2">Nume Proiect</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input-field"
                  placeholder="ex: Sala Fitness Central"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-anthracite-300 mb-2">Suprafață Totală (m²)</label>
                  <input
                    type="number"
                    value={totalArea}
                    onChange={(e) => setTotalArea(e.target.value)}
                    className="input-field"
                    placeholder="ex: 500"
                    min="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite-300 mb-2">Lungime (m)</label>
                  <input
                    type="number"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    className="input-field"
                    placeholder="ex: 25"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-anthracite-300 mb-2">Lățime (m)</label>
                  <input
                    type="number"
                    value={widthM}
                    onChange={(e) => setWidthM(e.target.value)}
                    className="input-field"
                    placeholder="ex: 20"
                    min="1"
                  />
                </div>
              </div>

              {variant === 'plan_existing' && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-anthracite-300">
                      Opțional: introdu suprafața estimată per zonă (m²)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ZONE_DEFINITIONS.map((def) => (
                      <div key={def.id} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: def.color }} />
                        <span className="text-sm text-anthracite-300 flex-1 min-w-0 truncate">{def.name}</span>
                        <input
                          type="number"
                          value={customZoneAreas[def.id] || ''}
                          onChange={(e) => setCustomZoneAreas(prev => ({ ...prev, [def.id]: e.target.value }))}
                          className="w-20 bg-anthracite-800 border border-anthracite-600 rounded-lg px-2 py-1.5 text-sm text-white text-right"
                          placeholder={`${Math.round((def.defaultPercent / 100) * Number(totalArea || 0))}`}
                          min="0"
                        />
                        <span className="text-xs text-anthracite-500">m²</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {variant === 'from_scratch' && totalArea && (
                <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-gold-400" />
                    <span className="text-sm font-medium text-white">Împărțire propusă automat</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ZONE_DEFINITIONS.map((def) => (
                      <div key={def.id} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: def.color }} />
                        <span className="text-xs text-anthracite-300 truncate">{def.name}</span>
                        <span className="text-xs text-gold-400 ml-auto font-medium">
                          {Math.round((def.defaultPercent / 100) * Number(totalArea))} m²
                        </span>
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
                <ArrowLeft className="w-4 h-4" /> Înapoi
              </button>
              <button
                onClick={goToStep3}
                disabled={!canProceedStep2}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuă <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Zone Editor + Equipment Library */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Zone & Echipamente</h2>
                <p className="text-anthracite-400 text-sm flex items-center gap-2">
                  <Move className="w-3.5 h-3.5" />
                  Trage echipamente din bibliotecă și poziționează-le în zone
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                  overBudget
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {totalAllocated.toFixed(0)} / {totalAreaNum} m²
                </div>
                <button
                  onClick={() => setShowLibrary(!showLibrary)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showLibrary ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-anthracite-800 text-anthracite-300 border border-anthracite-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Bibliotecă
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Se salvează...' : saved ? 'Salvat!' : 'Salvează'}
                </button>
              </div>
            </div>

            {overBudget && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
                ⚠️ Suma zonelor depășește suprafața totală. Redimensionează zonele.
              </div>
            )}

            <div className={`grid gap-4 ${showLibrary ? 'grid-cols-1 lg:grid-cols-[1fr_280px]' : 'grid-cols-1'}`}>
              {/* SVG Plan */}
              <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 overflow-hidden">
                <div className="relative" style={{ paddingBottom: `${Math.min((Number(widthM) / Number(lengthM)) * 100, 80)}%` }}>
                  <svg
                    ref={svgRef}
                    viewBox="0 0 100 100"
                    className="absolute inset-0 w-full h-full"
                    style={{ cursor: dragging || draggingEquipment ? 'grabbing' : 'default' }}
                    onClick={() => setSelectedEquipment(null)}
                  >
                    {/* Background */}
                    <rect x="0" y="0" width="100" height="100" fill="#1a1a2e" stroke="#374151" strokeWidth="0.3" />

                    {/* Grid lines */}
                    {Array.from({ length: 10 }, (_, i) => (
                      <g key={`grid-${i}`}>
                        <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="#374151" strokeWidth="0.1" strokeDasharray="1,1" />
                        <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="#374151" strokeWidth="0.1" strokeDasharray="1,1" />
                      </g>
                    ))}

                    {/* Zones */}
                    {zones.map((zone) => (
                      <g key={zone.id}>
                        <rect
                          x={zone.x}
                          y={zone.y}
                          width={zone.w}
                          height={zone.h}
                          fill={zone.color}
                          fillOpacity="0.15"
                          stroke={zone.color}
                          strokeWidth="0.3"
                          rx="0.5"
                        />
                        {zone.w > 10 && zone.h > 6 && (
                          <text
                            x={zone.x + zone.w / 2}
                            y={zone.y + 3}
                            textAnchor="middle"
                            fill={zone.color}
                            fontSize="2"
                            fontWeight="600"
                            opacity="0.7"
                          >
                            {zone.name}
                          </text>
                        )}

                        {/* Right edge handle */}
                        <rect
                          x={zone.x + zone.w - 0.8}
                          y={zone.y + zone.h / 2 - 2}
                          width="1.6"
                          height="4"
                          fill={zone.color}
                          fillOpacity="0.5"
                          rx="0.4"
                          style={{ cursor: 'ew-resize' }}
                          onMouseDown={(e) => handleMouseDown(e, zone.id, 'right')}
                          onTouchStart={(e) => handleTouchStart(e, zone.id, 'right')}
                        />
                        {/* Bottom edge handle */}
                        <rect
                          x={zone.x + zone.w / 2 - 2}
                          y={zone.y + zone.h - 0.8}
                          width="4"
                          height="1.6"
                          fill={zone.color}
                          fillOpacity="0.5"
                          rx="0.4"
                          style={{ cursor: 'ns-resize' }}
                          onMouseDown={(e) => handleMouseDown(e, zone.id, 'bottom')}
                          onTouchStart={(e) => handleTouchStart(e, zone.id, 'bottom')}
                        />
                        {/* Corner handle */}
                        <rect
                          x={zone.x + zone.w - 1.5}
                          y={zone.y + zone.h - 1.5}
                          width="2.5"
                          height="2.5"
                          fill={zone.color}
                          fillOpacity="0.7"
                          rx="0.4"
                          style={{ cursor: 'nwse-resize' }}
                          onMouseDown={(e) => handleMouseDown(e, zone.id, 'right-bottom')}
                          onTouchStart={(e) => handleTouchStart(e, zone.id, 'right-bottom')}
                        />
                      </g>
                    ))}

                    {/* Placed Equipment */}
                    {placedEquipment.map((eq) => (
                      <g key={eq.instanceId}>
                        <rect
                          x={eq.x}
                          y={eq.y}
                          width={eq.w}
                          height={eq.h}
                          fill={getZoneColor(eq.zoneId)}
                          fillOpacity={selectedEquipment === eq.instanceId ? 0.8 : 0.5}
                          stroke={selectedEquipment === eq.instanceId ? '#ffffff' : getZoneColor(eq.zoneId)}
                          strokeWidth={selectedEquipment === eq.instanceId ? 0.4 : 0.2}
                          rx="0.3"
                          style={{ cursor: 'grab' }}
                          onMouseDown={(e) => handleEquipMouseDown(e, eq.instanceId)}
                          onTouchStart={(e) => handleEquipTouchStart(e, eq.instanceId)}
                          onClick={(e) => { e.stopPropagation(); setSelectedEquipment(eq.instanceId); }}
                        />
                        {eq.w > 3 && eq.h > 2 && (
                          <text
                            x={eq.x + eq.w / 2}
                            y={eq.y + eq.h / 2 + 0.5}
                            textAnchor="middle"
                            fill="white"
                            fontSize={Math.min(eq.w / 5, 1.8)}
                            fontWeight="500"
                            pointerEvents="none"
                          >
                            {eq.name.length > 12 ? eq.name.slice(0, 10) + '…' : eq.name}
                          </text>
                        )}
                      </g>
                    ))}

                    {/* Dimension labels */}
                    <text x="50" y="99" textAnchor="middle" fill="#9CA3AF" fontSize="2">
                      {lengthM}m
                    </text>
                    <text x="1" y="50" textAnchor="middle" fill="#9CA3AF" fontSize="2" transform="rotate(-90, 1, 50)">
                      {widthM}m
                    </text>
                  </svg>
                </div>

                {/* Selected equipment info bar */}
                {selectedEquipment && (
                  <div className="mt-3 flex items-center justify-between bg-anthracite-900 border border-anthracite-600 rounded-lg px-3 py-2">
                    <span className="text-sm text-white font-medium">
                      {placedEquipment.find(e => e.instanceId === selectedEquipment)?.name}
                      <span className="text-anthracite-400 ml-2">
                        ({placedEquipment.find(e => e.instanceId === selectedEquipment)?.length_m}m × {placedEquipment.find(e => e.instanceId === selectedEquipment)?.width_m}m)
                      </span>
                    </span>
                    <button
                      onClick={() => removeEquipment(selectedEquipment)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Șterge
                    </button>
                  </div>
                )}
              </div>

              {/* Equipment Library Sidebar */}
              {showLibrary && (
                <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gold-400" />
                    Bibliotecă Echipamente
                  </h3>

                  {/* Zone filter */}
                  <select
                    value={equipmentFilter}
                    onChange={(e) => setEquipmentFilter(e.target.value)}
                    className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg px-2 py-1.5 text-xs text-anthracite-200 mb-3"
                  >
                    <option value="all">Toate zonele</option>
                    {ZONE_DEFINITIONS.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>

                  {/* Equipment list */}
                  <div className="space-y-1.5">
                    {filteredCatalog.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => addEquipmentToZone(template)}
                        className="w-full text-left p-2 rounded-lg bg-anthracite-900/50 border border-anthracite-700 hover:border-anthracite-500 hover:bg-anthracite-700/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: getZoneColor(template.zone) }} />
                          <span className="text-xs font-medium text-white group-hover:text-gold-400 transition-colors truncate">
                            {template.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-anthracite-400 mt-0.5 ml-4">
                          {template.length_m}m × {template.width_m}m · {ZONE_DEFINITIONS.find(z => z.id === template.zone)?.name}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-anthracite-700">
                    <p className="text-[10px] text-anthracite-500">
                      Click pe un echipament pentru a-l adăuga în zona corespunzătoare. Apoi trage-l pe plan pentru a-l poziționa.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Zone Legend + Placed Equipment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Legendă Zone</h3>
                <div className="grid grid-cols-2 gap-2">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: zone.color }} />
                      <span className="text-xs text-anthracite-300 truncate">{zone.name}</span>
                      <span className="text-xs text-anthracite-500 ml-auto">{zone.area_m2}m²</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Echipamente Plasate ({placedEquipment.length})
                </h3>
                {placedEquipment.length === 0 ? (
                  <p className="text-xs text-anthracite-500">
                    Niciun echipament plasat. Adaugă din bibliotecă.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {placedEquipment.map((eq) => (
                      <div key={eq.instanceId} className="flex items-center gap-2 group">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: getZoneColor(eq.zoneId) }} />
                        <span className="text-xs text-anthracite-300 truncate flex-1">{eq.name}</span>
                        <button
                          onClick={() => removeEquipment(eq.instanceId)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
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
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Înapoi
              </button>
              <button
                onClick={handleSave}
                disabled={saving || overBudget}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Se salvează...' : 'Salvează Proiect'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
