import { NextResponse } from 'next/server';
import { contentSecurityPolicy } from './lib/model-texture-policy';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const isDevelopment = process.env.NODE_ENV === 'development';
  let supabaseOrigin = '';
  try { const origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').origin; if (origin !== 'null') supabaseOrigin = ` ${origin}`; } catch {}

  const devSocket = new URL(request.url);
  devSocket.protocol = devSocket.protocol === 'https:' ? 'wss:' : 'ws:';
  const devConnections = isDevelopment ? ` ${devSocket.origin}` : '';

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicy({ isDevelopment, supabaseOrigin, devConnections })
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
