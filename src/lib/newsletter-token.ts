import crypto from 'node:crypto';

export function unsubscribeToken(email: string) {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Newsletter signing secret missing');
  return crypto.createHmac('sha256', secret).update(`newsletter-unsubscribe:${email.trim().toLowerCase()}`).digest('hex');
}
export function validUnsubscribeToken(email: string, token: unknown) {
  return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(unsubscribeToken(email)));
}
