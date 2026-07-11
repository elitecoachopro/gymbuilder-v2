import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Adresa de email este obligatorie.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Dacă adresa de email există în sistem, vei primi un link de resetare.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Save reset token to database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiresAt,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Reset token save error:', updateError);
      return NextResponse.json(
        { error: 'Eroare internă. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.full_name.split(' ')[0]);
    } catch (emailError) {
      console.error('Reset email send error:', emailError);
      // Still return success to prevent enumeration
    }

    return NextResponse.json({
      success: true,
      message: 'Dacă adresa de email există în sistem, vei primi un link de resetare.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
