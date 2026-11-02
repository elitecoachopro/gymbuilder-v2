import type { TrafficSource } from './traffic-attribution';

const publicPages = new Set([
  '/', '/products', '/suppliers', '/pricing', '/about', '/faq', '/contact',
  '/consultation', '/cum-functioneaza', '/construieste-sala', '/configurator',
  '/configurator/studio', '/blog',
]);
const detailPage = /^\/(?:products|suppliers)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function analyticsPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return publicPages.has(value) || detailPage.test(value) ? value : null;
}

export function analyticsDays(value: string | null): 7 | 30 | 90 | null {
  if (value === null) return 30;
  return value === '7' || value === '30' || value === '90' ? Number(value) as 7 | 30 | 90 : null;
}

export interface TrafficSummary {
  days: number;
  since: string | null;
  totals: { views: number; sessions: number; profile_views: number; product_views: number };
  daily: { day: string; views: number; sessions: number }[];
  pages: { path: string; views: number }[];
}

export interface DetailedTrafficReport extends TrafficSummary {
  day: string;
  timezone: string;
  hourly: { hour: number; views: number }[];
  sources: { source: TrafficSource; views: number; sessions: number }[];
  actions: { phone: number; whatsapp: number };
  business: { projects_created: number | null; projects_completed: number | null; requests: number; messages: number | null };
  recent: { path: string; kind: 'view' | 'phone' | 'whatsapp'; source: TrafficSource; occurred_at: string }[];
}
