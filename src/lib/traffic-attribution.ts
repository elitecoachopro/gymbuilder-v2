export const trafficSources = ['direct', 'facebook', 'instagram', 'google', 'bing', 'email', 'tiktok', 'linkedin', 'campaign', 'referral', 'unknown'] as const;
export type TrafficSource = typeof trafficSources[number];

export function trafficSource(search: string, referrer: string, origin: string): TrafficSource {
  const params = new URLSearchParams(search);
  const source = params.get('utm_source')?.toLowerCase().trim();
  if (source) {
    const aliases: Record<string, TrafficSource> = { fb: 'facebook', meta: 'facebook', facebook: 'facebook', ig: 'instagram', instagram: 'instagram', google: 'google', bing: 'bing', email: 'email', newsletter: 'email', tiktok: 'tiktok', linkedin: 'linkedin' };
    return aliases[source] || 'campaign';
  }
  if (params.has('fbclid')) return 'facebook';
  try {
    const url = new URL(referrer);
    if (url.origin === origin) return 'direct';
    const host = url.hostname.toLowerCase();
    for (const [domain, category] of [['facebook.com', 'facebook'], ['instagram.com', 'instagram'], ['bing.com', 'bing'], ['tiktok.com', 'tiktok'], ['linkedin.com', 'linkedin']] as const) {
      if (host === domain || host.endsWith(`.${domain}`)) return category;
    }
    if (/^(www\.)?google\.[a-z.]+$/.test(host)) return 'google';
    return 'referral';
  } catch { return 'direct'; }
}

export function trafficContact(href: string): 'phone' | 'whatsapp' | null {
  if (/^tel:\+?[\d\s()-]+$/i.test(href)) return 'phone';
  try {
    const url = new URL(href);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    if (url.hostname === 'wa.me' || url.hostname === 'whatsapp.com' || url.hostname.endsWith('.whatsapp.com')) return 'whatsapp';
  } catch {}
  return null;
}
