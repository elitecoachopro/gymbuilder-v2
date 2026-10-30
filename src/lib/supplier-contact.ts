import { isValidEmail } from './sanitize.ts';

export function supplierWebsite(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
    return ['https:', 'http:'].includes(url.protocol) && url.hostname && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function supplierTelephone(value: string | null | undefined): string | null {
  if (!value) return null;
  const phone = value.trim().replace(/[\s().-]/g, '');
  return /^\+?\d{6,15}$/.test(phone) ? `tel:${phone}` : null;
}

export function supplierEmail(value: string | null | undefined): string | null {
  const email = value?.trim();
  return email && isValidEmail(email) && !/%0[ad]/i.test(email) ? `mailto:${encodeURIComponent(email).replace('%40', '@')}` : null;
}

export function parsePublicContactEmail(value: unknown): { valid: boolean; email: string | null } {
  if (value == null) return { valid: true, email: null };
  if (typeof value !== 'string') return { valid: false, email: null };
  const email = value.trim().toLowerCase();
  if (!email) return { valid: true, email: null };
  return isValidEmail(email) && !/%0[ad]/i.test(email) ? { valid: true, email } : { valid: false, email: null };
}
