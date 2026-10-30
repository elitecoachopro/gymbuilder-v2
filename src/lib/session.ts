import crypto from 'node:crypto';

export interface SessionPayload {
  userId: string;
  exp: number;
  version: number;
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Session signing secret is not configured');
  return secret;
}

export function createSessionToken(userId: string, version = 0): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 86400000, version });
  const signature = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return null;
    const payload = Buffer.from(parts[0], 'base64').toString('utf8');
    const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest();
    if (!crypto.timingSafeEqual(expected, Buffer.from(parts[1], 'hex'))) return null;
    const data = JSON.parse(payload);
    if (typeof data.userId !== 'string' || !data.userId || !Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
    const version = data.version ?? 0;
    if (!Number.isInteger(version) || version < 0) return null;
    return { userId: data.userId, exp: data.exp, version };
  } catch {
    return null;
  }
}
