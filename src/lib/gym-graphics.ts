export type GymGraphicsProfile = 'low' | 'auto' | 'standard';
export const INITIAL_GYM_VIEW = '2d' as const;
export const INITIAL_GYM_GRAPHICS: GymGraphicsProfile = 'low';
export const GYM_GRAPHICS = {
  low: { dpr: 1, antialias: false, shadows: false, environment: false },
  auto: { dpr: 2, antialias: true, shadows: false, environment: false },
  standard: { dpr: 1.5, antialias: true, shadows: true, environment: true },
} as const;

export function gymRenderDpr(profile: GymGraphicsProfile, width: number, height: number, moving: boolean) {
  const maximum = profile === 'auto' && moving ? 1.25 : GYM_GRAPHICS[profile].dpr;
  const pixels = profile === 'auto' && !moving ? 2_000_000 : 1_200_000;
  return Math.max(1, Math.min(maximum, Math.sqrt(pixels / Math.max(1, width * height))));
}

export function watchGraphicsContext(canvas: EventTarget, onFailure: () => void) {
  let failed = false;
  const recover = (event: Event) => {
    event.preventDefault();
    if (failed) return;
    failed = true;
    onFailure();
  };
  canvas.addEventListener('webglcontextlost', recover);
  canvas.addEventListener('webglcontextcreationerror', recover);
  return () => {
    canvas.removeEventListener('webglcontextlost', recover);
    canvas.removeEventListener('webglcontextcreationerror', recover);
  };
}
