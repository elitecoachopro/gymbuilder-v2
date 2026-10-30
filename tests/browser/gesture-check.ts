type Interruption = 'pointercancel' | 'escape' | 'wall' | 'opening' | 'equipment';

function geometry(svg: SVGSVGElement) {
  return JSON.stringify(Array.from(svg.querySelectorAll('g[role="button"]')).flatMap(node => {
    const rect = node.querySelector('rect'), polygon = node.querySelector('polygon');
    if (!rect && !polygon) return [];
    return [{ transform: node.getAttribute('transform'), rect: rect ? ['x', 'y', 'width', 'height'].map(key => rect.getAttribute(key)) : null, polygon: polygon?.getAttribute('points') }];
  }));
}

/** Arm an interruption of the next real primary drag; events travel through the real React SVG handlers. */
export function armGestureCheck(kind: Interruption, report: (message: string) => void) {
  const svg = document.querySelector<SVGSVGElement>('svg[aria-label="Planul sălii în metri"], svg[aria-label="Gym floor plan in metres"]');
  if (!svg) { report('FAIL: deschide planul 2D.'); return () => {}; }
  const target = kind === 'wall' ? svg.querySelector('[aria-label^="Perete interior"], [aria-label^="Partition wall"]') : kind === 'opening' ? svg.querySelector('[aria-label^="Ușă"], [aria-label^="Door"], [aria-label^="Fereastră"], [aria-label^="Window"]') : kind === 'equipment' ? Array.from(svg.querySelectorAll('g[role="button"]')).find(node => node.querySelector('polygon')) : svg;
  if (!target) { report('FAIL: proiectul nu conține obiectul necesar verificării.'); return () => {}; }
  const before = geometry(svg);
  const undo = document.querySelector<HTMLButtonElement>('button[aria-label="Anulează modificarea"],button[aria-label="Undo"]');
  const undoDisabled = undo?.disabled;
  let pointer: number | null = null, ended = false;
  const cleanup = () => { ended = true; document.removeEventListener('pointermove', interrupt, true); document.removeEventListener('pointerup', finish, true); };
  const finish = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (ended) return;
      const same = geometry(svg) === before && undo?.disabled === undoDisabled;
      report(`${same ? 'PASS' : 'FAIL'}: ${kind} — geometria și disponibilitatea Undo ${same ? 'au rămas neschimbate' : 's-au modificat'}.`);
      cleanup();
    }));
  };
  const interrupt = (event: PointerEvent) => {
    if (pointer !== null || !event.isPrimary || event.buttons !== 1 || !svg.contains(event.target as Node)) return;
    pointer = event.pointerId;
    document.removeEventListener('pointermove', interrupt, true);
    if (kind === 'escape') window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    else if (kind === 'pointercancel') svg.dispatchEvent(new PointerEvent('pointercancel', { pointerId: event.pointerId, pointerType: event.pointerType, isPrimary: true, bubbles: true }));
    else target.dispatchEvent(new PointerEvent('pointerdown', { pointerId: event.pointerId + 1, pointerType: 'touch', isPrimary: false, button: 0, buttons: 1, bubbles: true }));
  };
  document.addEventListener('pointermove', interrupt, true);
  document.addEventListener('pointerup', finish, true);
  report(`Armat: ${kind}. Trage acum un perete către o poziție validă.`);
  return cleanup;
}

export function checkSelectTouch(report: (message: string) => void) {
  const svg = document.querySelector<SVGSVGElement>('svg[aria-label="Planul sălii în metri"], svg[aria-label="Gym floor plan in metres"]');
  const tool = document.querySelector('[role="toolbar"] button[aria-pressed="true"]')?.textContent;
  if (!svg || !['Selectează', 'Select'].includes(tool ?? '')) { report('FAIL: alege instrumentul Selectează în 2D.'); return; }
  const targets = Array.from(svg.querySelectorAll('g[role="button"]')).filter(node => node.querySelector('rect,polygon'));
  const before = geometry(svg);
  let preventedScroll = false;
  for (const [i, target] of targets.entries()) {
    const options = { pointerId: i + 200, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, bubbles: true, cancelable: true, clientX: 100, clientY: 100 };
    const down = new PointerEvent('pointerdown', options); target.dispatchEvent(down);
    preventedScroll ||= down.defaultPrevented;
    svg.dispatchEvent(new PointerEvent('pointermove', { ...options, clientY: 150 }));
    svg.dispatchEvent(new PointerEvent('pointercancel', options));
    svg.dispatchEvent(new PointerEvent('pointerup', { ...options, buttons: 0, clientY: 150 }));
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const same = !preventedScroll && geometry(svg) === before;
    report(`${same ? 'PASS' : 'FAIL'}: select-touch — ${targets.length} obiecte; geometrie ${same ? 'păstrată, scroll neblocat' : 'modificată sau scroll blocat'}.`);
  }));
}
