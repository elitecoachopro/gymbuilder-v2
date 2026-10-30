const returnRoutes = new Set(['/admin', '/configurator/classic', '/configurator', '/configurator/studio', '/client/dashboard', '/supplier/dashboard', '/supplier/products', '/supplier/products/new', '/cos-cerere', '/delete-account', '/mobile/promotions']);

export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || /[\\\x00-\x20]/.test(value)) return null;
  try {
    const url = new URL(value, 'https://gymbuilder.invalid');
    return url.origin === 'https://gymbuilder.invalid' && returnRoutes.has(url.pathname) ? url.pathname + url.search + url.hash : null;
  } catch { return null; }
}
export function loginHref(path: string): string {
  const target = safeReturnPath(path);
  return target ? `/login?redirect=${encodeURIComponent(target)}` : '/login';
}
export function requestedPlan(value: string | null): string {
  return ['free', 'starter', 'professional', 'enterprise'].includes(value || '') ? value! : 'free';
}

export function canResumeDraft(owner: string, currentOwner: string | null, nonce: string, requestedNonce: string | null): boolean {
  return !!currentOwner && !!nonce && nonce === requestedNonce && (owner === 'guest' || owner === currentOwner);
}
