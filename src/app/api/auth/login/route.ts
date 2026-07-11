import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { verifyPassword } from '@/lib/password';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Simple JWT-like token using HMAC (pure JS, no native deps)
function generateSessionToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }); // 7 days
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(payload).toString('base64') + '.' + hmac;
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email și parola sunt obligatorii.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, full_name, password_hash, role, email_verified, avatar_url')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Email sau parolă incorectă.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email sau parolă incorectă.' },
        { status: 401 }
      );
    }

    // Check email verification
    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'Te rugăm să confirmi adresa de email înainte de a te autentifica.' },
        { status: 403 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken(user.id);

    // Build response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Autentificare reușită!',
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
      token: sessionToken,
    });

    // Set HTTP-only cookie for session
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
