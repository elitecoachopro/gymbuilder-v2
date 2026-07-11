import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hashPassword } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';

// Use service role to bypass RLS for user creation
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Toate câmpurile obligatorii trebuie completate.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Parola trebuie să aibă minim 8 caractere.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresa de email nu este validă.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un cont cu acest email există deja.' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: `${firstName} ${lastName}`,
        role: 'client',
        email_verified: false,
        verification_token: verificationToken,
      })
      .select('id, email, full_name')
      .single();

    if (insertError) {
      console.error('User creation error:', insertError);
      return NextResponse.json(
        { error: 'Eroare la crearea contului. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(email.toLowerCase(), verificationToken, firstName);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Don't fail registration if email fails - user can request resend
    }

    return NextResponse.json({
      success: true,
      message: 'Cont creat cu succes! Verifică emailul pentru a confirma adresa.',
      user: { id: newUser.id, email: newUser.email, name: newUser.full_name },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
