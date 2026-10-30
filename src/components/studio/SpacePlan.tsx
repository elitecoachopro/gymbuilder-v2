'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { assessEquipmentUsage } from '@/lib/gym-equipment-clearance';
import { EQUIPMENT_CATALOG } from '@/lib/gym-catalog';
import { itemPolygon, spaceBounds, spaceWalls, wallBox, type SpaceItem, type GymSpace } from '@/lib/gym-space';
import { editStructure, structureGesture, type StructureCommand, type StructureGesture } from '@/lib/gym-space-edit';
import { useUiText } from '@/i18n/useUiText';
import { useClientLocale } from '@/i18n/client';
import { DEFAULT_VISUALIZATION, sceneDimensions, snapMetres } from '@/lib/gym-visualization';

type Props = { space: GymSpace; selected: string | null; onSelect: (id: string | null) => void; onMove: (id: string, x: number, y: number) => boolean; onEdit: (command: StructureCommand) => string | null; height: number; budget: number | null; disabled: boolean; label: string };
type Drag = { pointer: number; source: GymSpace; clientX: number; clientY: number; dx: number; dy: number; scaleX: number; scaleY: number; cx: number; cy: number } & ({ kind: 'pan' } | { kind: 'item'; id: string } | { kind: 'structure'; gesture: StructureGesture });
const button = 'min-h-11 min-w-11 rounded-lg border border-white/20 px-3 text-xs text-anthracite-50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400';
const svgControl = 'focus:outline-none [&:focus-visible>rect]:stroke-[#0758b6] [&:focus-visible>rect]:[stroke-width:0.08] [&:focus-visible>polygon]:stroke-[#0758b6] [&:focus-visible>polygon]:[stroke-width:0.08] [&:focus-visible>circle:first-of-type]:stroke-[#0758b6]';
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export default function SpacePlan({ space, selected, onSelect, onMove, onEdit, height, budget, disabled, label }: Props) {
  const ui = useUiText(), locale = useClientLocale(), ref = useRef<SVGSVGElement>(null), gridId = useId();
  const t = (ro: string, en: string) => locale === 'en' ? en : ro;
  const [tool, setTool] = useState<'select' | 'edit' | 'pan'>('select');
  const [drag, setDragState] = useState<Drag | null>(null), dragRef = useRef<Drag | null>(null);
  const setDrag = (value: Drag | null) => { dragRef.current = value; setDragState(value); };
  const [showUsage, setShowUsage] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [camera, setCamera] = useState({ zoom: 1, cx: 10, cy: 7.5 });
  const bounds = spaceBounds(space), fullW = bounds.length + 2, fullH = bounds.width + 2;
  const viewW = fullW / camera.zoom, viewH = fullH / camera.zoom;
  const cx = clamp(camera.cx, -1 + viewW / 2, bounds.length + 1 - viewW / 2), cy = clamp(camera.cy, -1 + viewH / 2, bounds.width + 1 - viewH / 2);
  const visualization = space.visualization ?? DEFAULT_VISUALIZATION;
  const active = drag?.source === space && !disabled ? drag : null;
  const command = active?.kind === 'structure' ? structureGesture(space, active.gesture, active.dx, active.dy) : null;
  const preview = command ? editStructure(space, command, height, budget) : null;
  const displaySpace = preview?.space ?? space;
  const walls = spaceWalls(displaySpace);
  const item = space.items.find(item => item.id === selected);
  const previewItem = (item: SpaceItem) => active?.kind === 'item' && active.id === item.id ? { ...item, x: snapMetres(item.x + active.dx, visualization.snap), y: snapMetres(item.y + active.dy, visualization.snap) } : item;
  const displayedItem = item ? previewItem(item) : undefined;
  const usage = useMemo(() => showUsage && displayedItem ? assessEquipmentUsage(displaySpace, displayedItem) : null, [showUsage, displaySpace, displayedItem]);
  const dimensions = visualization.dimensions ? sceneDimensions(space.outline, item ? itemPolygon(item) : undefined) : [];
  const selectedWall = displaySpace.walls.find(w => w.id === selected);
  const selectedOpening = displaySpace.openings.find(o => o.id === selected);
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') { dragRef.current = null; setDragState(null); setMessage(null); } };
    window.addEventListener('keydown', cancel);
    return () => window.removeEventListener('keydown', cancel);
  }, []);
  const begin = (e: React.PointerEvent, target: { kind: 'pan' } | { kind: 'item'; id: string } | { kind: 'structure'; gesture: StructureGesture }) => {
    if (e.button !== 0 || !e.isPrimary || (disabled && target.kind !== 'pan')) return;
    e.preventDefault(); e.stopPropagation();
    ref.current?.setPointerCapture(e.pointerId);
    const matrix = ref.current!.getScreenCTM()!.inverse();
    setMessage(null); setDrag({ ...target, pointer: e.pointerId, source: space, clientX: e.clientX, clientY: e.clientY, dx: 0, dy: 0, scaleX: matrix.a, scaleY: matrix.d, cx, cy });
  };
  const select = (e: React.PointerEvent, id: string, gesture?: StructureGesture) => {
    if (tool === 'pan') { begin(e, { kind: 'pan' }); return; }
    e.stopPropagation();
    if (!e.isPrimary || e.button !== 0) return;
    onSelect(id); setMessage(null);
    if (tool === 'edit') begin(e, gesture ? { kind: 'structure', gesture } : { kind: 'item', id });
    else if (!gesture && e.pointerType === 'mouse') begin(e, { kind: 'item', id });
  };
  const finish = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current || e.pointerId !== current.pointer) return;
    setDrag(null);
    if (current.source !== space || disabled || current.kind === 'pan' || Math.hypot(e.clientX - current.clientX, e.clientY - current.clientY) < 3) return;
    const dx = (e.clientX - current.clientX) * current.scaleX, dy = (e.clientY - current.clientY) * current.scaleY;
    if (current.kind === 'structure') setMessage(onEdit(structureGesture(space, current.gesture, dx, dy)));
    else {
      const original = space.items.find(i => i.id === current.id);
      if (original) onMove(original.id, snapMetres(original.x + dx, visualization.snap), snapMetres(original.y + dy, visualization.snap));
    }
  };
  const keyboardSelect = (e: React.KeyboardEvent, id: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); } };
  const handle = (x: number, y: number, gesture: StructureGesture, name: string) => <g className={svgControl} role="button" tabIndex={0} aria-label={name} onKeyDown={e => keyboardSelect(e, gesture.id)} onPointerDown={e => begin(e, { kind: 'structure', gesture })} style={{ cursor: 'ew-resize' }}>
    <title>{name}</title><circle cx={x} cy={y} r="0.12" fill="#fff4ce" stroke="#8c6329" strokeWidth="0.05" /><circle cx={x} cy={y} r="0.12" fill="transparent" stroke="transparent" strokeWidth="34" vectorEffect="non-scaling-stroke" />
  </g>;
  const ghost = command?.kind === 'wall' && preview?.error ? { ...space.walls.find(w => w.id === command.id)!, ...command.patch } : null;
  const ghostOpening = command?.kind === 'opening' && preview?.error ? { ...space.openings.find(o => o.id === command.id)!, ...command.patch } : null;
  const openingShape = (o: GymSpace['openings'][number], invalid = false) => {
    const w = walls.find(w => w.id === o.wallId); if (!w) return null;
    const horizontal = w.axis === 'x';
    return <g className={svgControl} key={invalid ? `ghost-${o.id}` : o.id} role={invalid ? undefined : 'button'} tabIndex={invalid ? undefined : 0} aria-label={invalid ? undefined : `${o.kind === 'door' ? t('Ușă', 'Door') : t('Fereastră', 'Window')} ${space.openings.findIndex(v => v.id === o.id) + 1}`} aria-pressed={invalid ? undefined : selected === o.id}
      onKeyDown={e => keyboardSelect(e, o.id)} onPointerDown={e => { if (!invalid) select(e, o.id, { kind: 'opening-move', id: o.id }); }} pointerEvents={invalid ? 'none' : undefined} transform={`translate(${w.x + (horizontal ? o.offset : 0)} ${w.y + (horizontal ? 0 : o.offset)}) rotate(${horizontal ? 0 : 90})`}>
      <rect x="0" y="-0.12" width={Math.max(0.01, o.width)} height="0.24" fill={invalid ? '#fca5a5' : o.kind === 'door' ? '#f2e0b7' : '#8dbecb'} stroke={invalid ? '#b91c1c' : selected === o.id ? '#8c6329' : 'none'} strokeWidth="0.07" />
      {!invalid && <line x1="0" x2={o.width} y1="0" y2="0" stroke="transparent" strokeWidth="22" vectorEffect="non-scaling-stroke" />}
      {o.kind === 'door' && <path d={`M 0 0 L 0 ${o.width} M 0 ${o.width} A ${Math.max(0.01, o.width)} ${Math.max(0.01, o.width)} 0 0 0 ${o.width} 0`} fill="none" stroke={invalid ? '#b91c1c' : '#b18a48'} strokeWidth="0.035" />}
    </g>;
  };
  return <div className="w-full h-full flex flex-col min-h-0" role="group" aria-label={label}>
    <div className="flex flex-wrap gap-2 p-2 bg-anthracite-800" role="toolbar" aria-label={t('Navigare și editare plan 2D', '2D navigation and editing')}>
      {(['select', 'edit', 'pan'] as const).map(key => <button key={key} className={`${button} ${tool === key ? 'bg-white/15' : ''}`} aria-pressed={tool === key} disabled={disabled && key === 'edit'} onClick={() => { setDrag(null); setTool(key); }}>{key === 'select' ? t('Selectează', 'Select') : key === 'edit' ? t('Mută / dimensionează', 'Move / resize') : t('Deplasează planul', 'Pan plan')}</button>)}
      <button className={button} aria-label={t('Micșorează planul', 'Zoom out plan')} disabled={camera.zoom <= 1} onClick={() => setCamera({ cx, cy, zoom: Math.max(1, camera.zoom / 1.5) })}>−</button><button className={button} aria-label={t('Mărește planul', 'Zoom in plan')} disabled={camera.zoom >= 4} onClick={() => setCamera({ cx, cy, zoom: Math.min(4, camera.zoom * 1.5) })}>+</button>
      <button className={button} onClick={() => { setDrag(null); setCamera({ zoom: 1, cx: bounds.length / 2, cy: bounds.width / 2 }); }}>{t('Încadrează sala', 'Fit room')}</button>
      <label className="min-h-11 flex items-center gap-2 text-xs text-anthracite-50 px-2"><input type="checkbox" checked={showUsage} onChange={e => setShowUsage(e.target.checked)} />{t('Spațiu de utilizare orientativ', 'Estimated usage space')}</label>
      {camera.zoom > 1 && <div className="flex gap-2">{([[-1, 0, '←', t('Plan spre stânga', 'Plan left')], [1, 0, '→', t('Plan spre dreapta', 'Plan right')], [0, -1, '↑', t('Plan în sus', 'Plan up')], [0, 1, '↓', t('Plan în jos', 'Plan down')]] as const).map(([x, y, arrow, name]) => <button key={name} className={button} aria-label={name} onClick={() => setCamera({ ...camera, cx: cx + x * viewW * 0.2, cy: cy + y * viewH * 0.2 })}>{arrow}</button>)}</div>}
    </div>
    <p className={`px-3 py-1 text-xs ${preview?.error || message ? 'bg-red-950 text-red-100' : 'bg-anthracite-800 text-anthracite-200'}`} role="status">{preview?.error ? t('Poziție invalidă — proiectul rămâne neschimbat.', 'Invalid position — the project stays unchanged.') : message || (tool === 'edit' ? t('Trage peretele sau deschiderea; mânerul rotund schimbă lungimea/lățimea. Escape anulează.', 'Drag a wall or opening; the round handle changes length/width. Escape cancels.') : tool === 'pan' ? t('Trage pentru navigare. Geometria nu se modifică.', 'Drag to navigate. Geometry does not change.') : t('Selectează un perete sau o deschidere. Pe telefon poți derula; pentru tragere alege Mută / dimensionează.', 'Select a wall or opening. On phones you can scroll; choose Move / resize to drag.'))}</p>
    <svg ref={ref} viewBox={`${cx - viewW / 2} ${cy - viewH / 2} ${viewW} ${viewH}`} className={`w-full flex-1 min-h-0 ${tool === 'select' ? 'touch-pan-y' : 'touch-none'}`} role="group" aria-label={label}
      onPointerDownCapture={e => { if (!e.isPrimary) setDrag(null); }}
      onPointerDown={e => { if (!e.isPrimary) return; if (tool === 'pan') begin(e, { kind: 'pan' }); else if (e.target === e.currentTarget) onSelect(null); }}
      onPointerMove={e => {
        const current = dragRef.current; if (!current || current.pointer !== e.pointerId) return;
        const dx = (e.clientX - current.clientX) * current.scaleX, dy = (e.clientY - current.clientY) * current.scaleY;
        if (current.kind === 'pan') setCamera({ zoom: camera.zoom, cx: current.cx - dx, cy: current.cy - dy });
        else setDrag({ ...current, dx, dy });
      }} onPointerUp={finish} onPointerCancel={() => setDrag(null)} onLostPointerCapture={() => setDrag(null)}>
      <defs><pattern id={gridId} width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#b1bab5" strokeWidth="0.018" /></pattern></defs>
      <polygon points={space.outline.map(p => `${p.x},${p.y}`).join(' ')} fill="#ebede7" stroke="#4c555a" strokeWidth="0.12" />
      <polygon points={space.outline.map(p => `${p.x},${p.y}`).join(' ')} fill={`url(#${gridId})`} />
      {space.areas.map(a => <g key={a.id}><rect x={a.x} y={a.y} width={a.w} height={a.d} fill={a.colour} opacity="0.16" /><text x={a.x + 0.16} y={a.y + 0.4} fontSize="0.26" fill="#47545a">{ui(a.name)}</text></g>)}
      {showUsage && usage?.envelope && <g role="img" aria-label={t('Contur orientativ de utilizare', 'Estimated usage outline')} pointerEvents="none"><title>{t('Contur punctat: estimare de utilizare, nu amprentă fizică.', 'Dashed outline: usage estimate, not physical footprint.')}{usage.conflicts.length ? t(' Există suprapuneri orientative.', ' Advisory overlaps detected.') : ''}</title><polygon points={usage.envelope.map(p => `${p.x},${p.y}`).join(' ')} fill={usage.conflicts.length ? '#e69b18' : '#3384b8'} fillOpacity="0.16" stroke={usage.conflicts.length ? '#9a5800' : '#0758b6'} strokeWidth="0.06" strokeDasharray="0.18 0.12" /></g>}
      {walls.map(w => { const b = wallBox(w), editable = space.walls.some(v => v.id === w.id); return <g className={svgControl} key={w.id} role={editable ? 'button' : undefined} tabIndex={editable ? 0 : undefined} aria-label={editable ? `${t('Perete interior', 'Partition wall')} ${space.walls.findIndex(v => v.id === w.id) + 1}` : undefined} aria-pressed={editable ? selected === w.id : undefined} onKeyDown={e => keyboardSelect(e, w.id)} onPointerDown={e => { if (editable) select(e, w.id, { kind: 'wall-move', id: w.id }); }}>
        <rect x={b.x} y={b.y} width={b.w} height={b.d} fill={selected === w.id ? '#b08d57' : '#68716e'} />{editable && <line x1={w.x} y1={w.y} x2={w.x + (w.axis === 'x' ? w.length : 0)} y2={w.y + (w.axis === 'y' ? w.length : 0)} stroke="transparent" strokeWidth="16" vectorEffect="non-scaling-stroke" />}
      </g>; })}
      {displaySpace.openings.map(o => openingShape(o))}
      {space.columns.map(c => <rect key={c.id} x={c.x} y={c.y} width={c.w} height={c.d} fill="#424c50" />)}
      {space.stairwell && <g><rect x={space.stairwell.x} y={space.stairwell.y} width={space.stairwell.w} height={space.stairwell.d} fill="#c3b28c" stroke="#625b4c" strokeWidth="0.06" />{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M ${space.stairwell!.x} ${space.stairwell!.y + i * space.stairwell!.d / 11} h ${space.stairwell!.w}`} stroke="#726c5d" strokeWidth="0.025" />)}<text x={space.stairwell.x + .1} y={space.stairwell.y + .4} fontSize="0.24">{ui('Scară · acces etaj')}</text></g>}
      {space.items.map(item => { const model = EQUIPMENT_CATALOG.find(t => t.id === item.templateId)!; const display = previewItem(item); return <g className={svgControl} key={item.id} role="button" tabIndex={0} aria-label={ui(model.name)} aria-pressed={selected === item.id} onKeyDown={e => keyboardSelect(e, item.id)} onPointerDown={e => select(e, item.id)}>
        <title>{ui(model.name)}</title><polygon points={itemPolygon(display).map(p => `${p.x},${p.y}`).join(' ')} fill={selected === item.id ? '#d1ac68' : '#536775'} stroke={selected === item.id ? '#8c6329' : '#344b5b'} strokeWidth="0.045" /><text x={display.x} y={display.y + 0.045} textAnchor="middle" fontSize="0.16" fill="white" pointerEvents="none">{ui(model.name).slice(0, 15)}</text>
      </g>; })}
      {ghost && (() => { const b = wallBox({ ...ghost, length: Math.max(0.01, ghost.length) }); return <rect x={b.x} y={b.y} width={b.w} height={b.d} fill="#ef4444" stroke="#991b1b" strokeWidth="0.07" opacity="0.8" pointerEvents="none" />; })()}
      {ghostOpening && openingShape(ghostOpening, true)}
      <g pointerEvents="none">{dimensions.map((dimension, index) => <g key={index}><line x1={dimension.start.x} y1={dimension.start.y} x2={dimension.end.x} y2={dimension.end.y} stroke="#43515a" strokeWidth="0.025" />{[dimension.start, dimension.end].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="0.045" fill="#43515a" />)}<text x={dimension.label.x} y={dimension.label.y} textAnchor="middle" dominantBaseline="middle" fontSize="0.25" fill="#344651" stroke="#ebede7" strokeWidth="0.07" paintOrder="stroke">{dimension.length.toFixed(2)} m</text></g>)}</g>
      {tool === 'edit' && !disabled && selectedWall && handle(selectedWall.x + (selectedWall.axis === 'x' ? selectedWall.length : 0), selectedWall.y + (selectedWall.axis === 'y' ? selectedWall.length : 0), { kind: 'wall-length', id: selectedWall.id }, t('Ajustează lungimea peretelui', 'Adjust wall length'))}
      {tool === 'edit' && !disabled && selectedOpening && (() => { const w = walls.find(w => w.id === selectedOpening.wallId)!; return handle(w.x + (w.axis === 'x' ? selectedOpening.offset + selectedOpening.width : 0), w.y + (w.axis === 'y' ? selectedOpening.offset + selectedOpening.width : 0), { kind: 'opening-width', id: selectedOpening.id }, t('Ajustează lățimea deschiderii', 'Adjust opening width')); })()}
    </svg>
  </div>;
}
