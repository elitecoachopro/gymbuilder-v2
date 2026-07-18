/**
 * Input sanitization utilities to prevent XSS and SQL injection.
 * 
 * Note: Supabase uses parameterized queries by default which prevents SQL injection.
 * This module adds defense-in-depth for XSS prevention.
 */

/**
 * Strip HTML tags and encode special characters to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Encode HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove null bytes
    .replace(/\0/g, '')
    .trim();
}

/**
 * Sanitize email - only allow valid email characters
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove any characters that aren't valid in emails
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._%+\-@]/g, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize phone number - only allow digits, +, -, spaces, parentheses
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[^0-9+\-\s()]/g, '').trim();
}

/**
 * Sanitize a URL - basic validation and cleanup
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // Only allow http and https protocols
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Remove any script injections in URL
    if (trimmed.toLowerCase().includes('javascript:') || trimmed.toLowerCase().includes('data:')) {
      return '';
    }
    return trimmed;
  }
  
  return '';
}

/**
 * Sanitize numeric input - ensure it's a valid positive number
 */
export function sanitizeNumber(input: unknown): number | null {
  if (input === null || input === undefined || input === '') return null;
  
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return null;
  return num;
}

/**
 * Sanitize and validate a price (positive number with max 2 decimals)
 */
export function sanitizePrice(input: unknown): number | null {
  const num = sanitizeNumber(input);
  if (num === null || num < 0) return null;
  return Math.round(num * 100) / 100;
}

/**
 * Sanitize an object's string fields recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    }
  }
  
  return sanitized;
}

/**
 * Sanitize search input for PostgREST filter interpolation.
 * Escapes characters that have special meaning in PostgREST filter syntax:
 * commas (,), parentheses (()), periods (.), and percent signs (%).
 */
export function sanitizePostgrestSearch(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/\\/g, '\\\\')  // escape backslashes first
    .replace(/,/g, '\\,')     // commas separate filter arguments
    .replace(/\(/g, '\\(')    // opening parenthesis
    .replace(/\)/g, '\\)')    // closing parenthesis
    .replace(/\./g, '\\.')    // dots separate column names
    .trim()
    .slice(0, 200);            // limit length
}

/**
 * Check if a string contains potential SQL injection patterns
 * (Defense-in-depth - Supabase already uses parameterized queries)
 */
export function hasSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE)\b)/i,
    /(--|#|\/\*)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(;\s*(DROP|DELETE|INSERT|UPDATE))/i,
    /('.*(\bOR\b|\bAND\b).*')/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Parola trebuie să aibă minim 8 caractere.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Parola nu poate depăși 128 caractere.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Parola trebuie să conțină cel puțin o literă mare.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Parola trebuie să conțină cel puțin o literă mică.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Parola trebuie să conțină cel puțin o cifră.' };
  }
  return { valid: true, message: '' };
}
