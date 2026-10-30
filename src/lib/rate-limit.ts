import type { Database } from '@/types/database.generated';
import { localizedJson } from './json-response';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { isIP } from 'node:net';

interface RateLimitOptions { maxRequests: number; windowMs: number }
interface RateLimitResult { allowed: boolean; remaining: number; resetTime: number }

export async function checkRateLimit(identifier: string, options: RateLimitOptions = { maxRequests: 5, windowMs: 60000 }): Promise<RateLimitResult> {
  const database = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await database.rpc('consume_request_quota', {
    p_key_hash: crypto.createHash('sha256').update(identifier).digest('hex'),
    p_limit: options.maxRequests, p_window_ms: options.windowMs,
  });
  if (error || !data) {
    console.error('Rate limit storage unavailable');
    return { allowed: false, remaining: 0, resetTime: Date.now() + 60000 };
  }
  if (typeof data !== 'object' || Array.isArray(data) || typeof data.allowed !== 'boolean' || typeof data.remaining !== 'number' || typeof data.resetTime !== 'number') return { allowed: false, remaining: 0, resetTime: Date.now() + 60000 };
  return { allowed: data.allowed, remaining: data.remaining, resetTime: data.resetTime };
}

/**
 * Get client IP from request headers (works behind proxies like Vercel)
 */
export function getClientIP(request: Request): string {
  // Production headers must be set/overwritten by the trusted reverse proxy.
  const configured = process.env.TRUSTED_PROXY_IP_HEADER;
  const header = configured || (process.env.VERCEL === '1' ? 'x-vercel-forwarded-for' : process.env.NODE_ENV !== 'production' ? 'x-forwarded-for' : '');
  const address = header ? request.headers.get(header)?.split(',').at(-1)?.trim() : null;
  return address && isIP(address) ? address : 'unknown';
}

/**
 * Helper to create a rate-limited response
 */
export async function rateLimitResponse(resetTime: number): Promise<Response> {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  return localizedJson({
      error: 'Prea multe încercări. Vă rugăm să așteptați înainte de a încerca din nou.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}
