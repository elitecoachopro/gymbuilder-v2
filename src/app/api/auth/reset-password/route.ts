import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/password';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token și parola sunt obligatorii.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Parola trebuie să aibă minim 8 caractere.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find user by reset token
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, reset_token_expires_at')
      .eq('reset_token', token)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Token invalid sau expirat.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Token-ul de resetare a expirat. Solicită un nou link.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Password reset update error:', updateError);
      return NextResponse.json(
        { error: 'Eroare la resetarea parolei. Încearcă din nou.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Parola a fost resetată cu succes! Te poți autentifica acum.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
