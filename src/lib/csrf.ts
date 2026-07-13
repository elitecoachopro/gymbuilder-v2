/**
 * CSRF Protection using the Double Submit Cookie pattern.
 * 
 * How it works:
 * 1. Server generates a CSRF token and sets it as a cookie
 * 2. Client reads the cookie and sends the token in a header (X-CSRF-Token)
 * 3. Server verifies the header matches the cookie
 * 
 * This works because:
 * - A malicious site can trigger requests that include cookies (CSRF attack)
 * - But a malicious site CANNOT read cookies from another domain (Same-Origin Policy)
 * - So the attacker can't set the X-CSRF-Token header correctly
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a CSRF token. Sets the cookie if not present.
 * Call this in GET routes or page renders to ensure the token exists.
 */
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME);
  
  if (existing) {
    return existing.value;
  }
  
  const token = generateToken();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS to send in header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return token;
}

/**
 * Validate CSRF token from request.
 * Compares the X-CSRF-Token header with the csrf_token cookie.
 */
export async function validateCSRF(request: Request): Promise<boolean> {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieHeader = request.headers.get('cookie') || '';
  
  // Parse csrf_token from cookie header
  const cookieToken = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split('=')[1];

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * CSRF validation middleware for API routes.
 * Returns null if valid, or a Response if invalid.
 */
export async function csrfProtect(request: Request): Promise<Response | null> {
  const isValid = await validateCSRF(request);
  
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Token CSRF invalid. Reîncărcați pagina și încercați din nou.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  return null; // Valid - proceed
}
