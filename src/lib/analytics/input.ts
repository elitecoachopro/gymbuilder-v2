const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const publicPaths = new Set(['/', '/products', '/suppliers', '/contact', '/about', '/pricing', '/blog', '/faq', '/cum-functioneaza', '/construieste-sala', '/estimator-buget', '/compare', '/consultation', '/configurator', '/configurator/studio']);
export type AnalyticsTarget = { path: string; kind: 'application' | 'supplier' | 'product'; targetId: string | null };

export function analyticsTarget(path: unknown): AnalyticsTarget | null {
  if (typeof path !== 'string') return null;
  if (publicPaths.has(path)) return { path, kind: 'application', targetId: null };
  const parts = path.split('/');
  if (parts.length === 3 && ['products', 'suppliers'].includes(parts[1]) && uuid.test(parts[2])) {
    return { path: path.toLowerCase(), kind: parts[1] === 'products' ? 'product' : 'supplier', targetId: parts[2].toLowerCase() };
  }
  if (/^\/construieste-sala\/[a-z0-9-]{1,60}$/.test(path)) return { path, kind: 'application', targetId: null };
  return null;
}

export function parseViewInput(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const body = value as Record<string, unknown>;
  const target = analyticsTarget(body.path);
  if (!target || body.consent !== true || typeof body.eventId !== 'string' || !uuid.test(body.eventId) || typeof body.sessionId !== 'string' || !uuid.test(body.sessionId)) return null;
  return { ...target, eventId: body.eventId, sessionId: body.sessionId };
}

export function analyticsPeriod(value: string | null): 7 | 30 | 90 | null {
  if (value === null) return 30;
  return value === '7' || value === '30' || value === '90' ? Number(value) as 7 | 30 | 90 : null;
}
