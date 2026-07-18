'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Dumbbell, LayoutGrid, Move, Save, Loader2, Info } from 'lucide-react';

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

interface Zone {
  id: string;
  name: string;
  color: string;
  x: number; // percentage of total width
  y: number; // percentage of total height
  w: number; // percentage of total width
  h: number; // percentage of total height
  area_m2: number;
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

  // SVG drag state
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ zoneId: string; edge: 'right' | 'bottom' | 'right-bottom' } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

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
    const maxCols = 3; // 3 columns layout
    let col = 0;

    ZONE_DEFINITIONS.forEach((def) => {
      let areaM2: number;
      if (variant === 'plan_existing' && customZoneAreas[def.id]) {
        areaM2 = Number(customZoneAreas[def.id]);
      } else {
        areaM2 = (def.defaultPercent / 100) * total;
      }

      const areaPercent = areaM2 / total;
      // Calculate width and height proportionally
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
        h: Math.max(zoneH, 8), // minimum 8% height
        area_m2: Math.round(areaM2 * 100) / 100,
      };

      rowHeight = Math.max(rowHeight, zone.h);
      currentX += zoneW;
      col++;
      zoneList.push(zone);
    });

    // Normalize: fit all zones within 100% height
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

  // Handle step transitions
  const goToStep3 = () => {
    generateZones();
    setStep(3);
  };

  // SVG mouse handlers for resizing
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

      // Recalculate area
      const totalAreaNum = Number(totalArea);
      const newAreaPercent = (newW / 100) * (newH / 100);
      const totalZoneAreaPercent = prev.reduce((sum, z) => {
        if (z.id === zone.id) return sum + newAreaPercent;
        return sum + (z.w / 100) * (z.h / 100);
      }, 0);

      // Validate: don't exceed total area
      if (totalZoneAreaPercent > 1.05) return zone; // 5% tolerance

      return {
        ...zone,
        w: newW,
        h: newH,
        area_m2: Math.round(newAreaPercent * totalAreaNum * 100) / 100,
      };
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

  // Touch handlers for mobile
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
        return {
          ...zone,
          w: newW,
          h: newH,
          area_m2: Math.round(newAreaPercent * totalAreaNum * 100) / 100,
        };
      }));
      setDragStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchEnd = () => {
      setDragging(null);
      setDragStart(null);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragging, dragStart, totalArea]);

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
          zones,
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

  return (
    <main className="min-h-screen bg-anthracite-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
                {s === 1 ? 'Variantă' : s === 2 ? 'Spațiu' : 'Zone'}
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
              {/* Project Name */}
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

              {/* Dimensions */}
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

              {/* Custom zone areas (Variant A only) */}
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

              {/* Variant B info */}
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

        {/* Step 3: Zone Editor */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Delimitare Zone</h2>
                <p className="text-anthracite-400 text-sm flex items-center gap-2">
                  <Move className="w-3.5 h-3.5" />
                  Trage de marginile zonelor pentru a le redimensiona
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

            {/* SVG Plan */}
            <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 overflow-hidden">
              <div className="relative" style={{ paddingBottom: `${(Number(widthM) / Number(lengthM)) * 100}%`, maxHeight: '500px' }}>
                <svg
                  ref={svgRef}
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full"
                  style={{ cursor: dragging ? 'grabbing' : 'default' }}
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
                      {/* Zone rectangle */}
                      <rect
                        x={zone.x}
                        y={zone.y}
                        width={zone.w}
                        height={zone.h}
                        fill={zone.color}
                        fillOpacity="0.2"
                        stroke={zone.color}
                        strokeWidth="0.4"
                        rx="0.5"
                      />

                      {/* Zone label */}
                      {zone.w > 10 && zone.h > 6 && (
                        <text
                          x={zone.x + zone.w / 2}
                          y={zone.y + zone.h / 2 - 1.5}
                          textAnchor="middle"
                          fill="white"
                          fontSize="2.5"
                          fontWeight="600"
                        >
                          {zone.name}
                        </text>
                      )}
                      {zone.w > 10 && zone.h > 6 && (
                        <text
                          x={zone.x + zone.w / 2}
                          y={zone.y + zone.h / 2 + 2.5}
                          textAnchor="middle"
                          fill={zone.color}
                          fontSize="2"
                          fontWeight="500"
                        >
                          {zone.area_m2} m²
                        </text>
                      )}

                      {/* Right edge handle */}
                      <rect
                        x={zone.x + zone.w - 1}
                        y={zone.y + zone.h / 2 - 3}
                        width="2"
                        height="6"
                        fill={zone.color}
                        fillOpacity="0.6"
                        rx="0.5"
                        style={{ cursor: 'ew-resize' }}
                        onMouseDown={(e) => handleMouseDown(e, zone.id, 'right')}
                        onTouchStart={(e) => handleTouchStart(e, zone.id, 'right')}
                      />

                      {/* Bottom edge handle */}
                      <rect
                        x={zone.x + zone.w / 2 - 3}
                        y={zone.y + zone.h - 1}
                        width="6"
                        height="2"
                        fill={zone.color}
                        fillOpacity="0.6"
                        rx="0.5"
                        style={{ cursor: 'ns-resize' }}
                        onMouseDown={(e) => handleMouseDown(e, zone.id, 'bottom')}
                        onTouchStart={(e) => handleTouchStart(e, zone.id, 'bottom')}
                      />

                      {/* Corner handle */}
                      <rect
                        x={zone.x + zone.w - 2}
                        y={zone.y + zone.h - 2}
                        width="3"
                        height="3"
                        fill={zone.color}
                        fillOpacity="0.8"
                        rx="0.5"
                        style={{ cursor: 'nwse-resize' }}
                        onMouseDown={(e) => handleMouseDown(e, zone.id, 'right-bottom')}
                        onTouchStart={(e) => handleTouchStart(e, zone.id, 'right-bottom')}
                      />
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
            </div>

            {/* Zone Legend */}
            <div className="bg-anthracite-800/50 border border-anthracite-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Legendă Zone</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {zones.map((zone) => (
                  <div key={zone.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: zone.color }} />
                    <span className="text-xs text-anthracite-300 truncate">{zone.name}</span>
                    <span className="text-xs text-anthracite-500 ml-auto">{zone.area_m2}m²</span>
                  </div>
                ))}
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
