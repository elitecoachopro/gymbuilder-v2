import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/password';
import { isStrongPassword } from '@/lib/sanitize';

function getSupabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (typeof token !== 'string' || typeof password !== 'string' || !token || !password) {
      return await localizedJson(
        { error: 'Token și parola sunt obligatorii.' },
        { status: 400 }
      );
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return await localizedJson(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find user by reset token
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, reset_token_expires_at, session_version')
      .eq('reset_token', token)
      .single();

    if (fetchError || !user) {
      return await localizedJson(
        { error: 'Token invalid sau expirat.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) <= new Date()) {
      return await localizedJson(
        { error: 'Token-ul de resetare a expirat. Solicită un nou link.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and clear reset token
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires_at: null,
        session_version: user.session_version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .eq('reset_token', token)
      .gt('reset_token_expires_at', new Date().toISOString())
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Password reset update error:', updateError);
      return await localizedJson(
        { error: 'Eroare la resetarea parolei. Încearcă din nou.' },
        { status: 500 }
      );
    }
    if (!updated) return await localizedJson({ error: 'Token invalid sau expirat.' }, { status: 400 });

    return await localizedJson({
      success: true,
      message: 'Parola a fost resetată cu succes! Te poți autentifica acum.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return await localizedJson(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
