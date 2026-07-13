/**
 * Client-side CSRF utilities.
 * Reads the CSRF token from the cookie and includes it in fetch headers.
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Get the CSRF token from cookies
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

/**
 * Enhanced fetch that automatically includes CSRF token
 */
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = getCSRFToken();
  
  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always send cookies
  });
}

/**
 * POST request with CSRF protection and JSON body
 */
export async function securePost(url: string, data: unknown): Promise<Response> {
  return secureFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * PUT request with CSRF protection and JSON body
 */
export async function securePut(url: string, data: unknown): Promise<Response> {
  return secureFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request with CSRF protection and JSON body
 */
export async function securePatch(url: string, data: unknown): Promise<Response> {
  return secureFetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request with CSRF protection
 */
export async function secureDelete(url: string): Promise<Response> {
  return secureFetch(url, {
    method: 'DELETE',
  });
}
