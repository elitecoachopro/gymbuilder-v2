import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { createSessionToken } from '@/lib/session';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEmail, isValidEmail } from '@/lib/sanitize';

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}



export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per minute per IP
    const ip = getClientIP(request);
    const rateCheck = await checkRateLimit(`login:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return await localizedJson(
        { error: 'Email și parola sunt obligatorii.' },
        { status: 400 }
      );
    }

    // Sanitize email
    const cleanEmail = sanitizeEmail(email);
    if (!isValidEmail(cleanEmail)) {
      return await localizedJson(
        { error: 'Format email invalid.' },
        { status: 400 }
      );
    }

    // Password length check (prevent DoS with huge passwords)
    if (password.length > 128) {
      return await localizedJson(
        { error: 'Parola nu poate depăși 128 caractere.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find user by email (parameterized query - SQL injection safe)
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, password_hash, role, email_verified, avatar_url, session_version')
      .eq('email', cleanEmail)
      .single();

    if (fetchError || !user) {
      // Log failed login attempt - user not found
      try {
        await supabase.from('auth_logs').insert({
          ip_address: ip,
          email_attempted: cleanEmail,
          event_type: 'login_failed',
          reason: 'user_not_found',
        });
      } catch { /* non-blocking */ }

      return await localizedJson(
        { error: 'Email sau parolă incorectă.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      // Log failed login attempt - wrong password
      try {
        await supabase.from('auth_logs').insert({
          ip_address: ip,
          email_attempted: cleanEmail,
          event_type: 'login_failed',
          reason: 'invalid_password',
        });
      } catch { /* non-blocking */ }

      return await localizedJson(
        { error: 'Email sau parolă incorectă.' },
        { status: 401 }
      );
    }

    // Check email verification
    if (!user.email_verified) {
      return await localizedJson(
        { error: 'Te rugăm să confirmi adresa de email înainte de a te autentifica.' },
        { status: 403 }
      );
    }

    // Generate session token
    const sessionToken = createSessionToken(user.id, user.session_version);

    // Build response with cookie
    const response = await localizedJson({
      success: true,
      message: 'Autentificare reușită!',
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
    });

    // Set HTTP-only cookie for session
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return await localizedJson(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
