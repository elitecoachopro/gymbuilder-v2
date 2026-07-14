import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hashPassword } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeString, sanitizePhone, isValidEmail, isStrongPassword } from '@/lib/sanitize';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 attempts per minute per IP
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Toate câmpurile obligatorii trebuie completate.' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const cleanEmail = sanitizeEmail(email);
    const cleanFirstName = sanitizeString(firstName).slice(0, 50);
    const cleanLastName = sanitizeString(lastName).slice(0, 50);
    const cleanPhone = phone ? sanitizePhone(phone).slice(0, 20) : null;

    // Validate email
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Adresa de email nu este validă.' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    // Validate name length
    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      return NextResponse.json(
        { error: 'Numele trebuie să aibă minim 2 caractere.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
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
        email: cleanEmail,
        password_hash: passwordHash,
        full_name: `${cleanFirstName} ${cleanLastName}`,
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
      await sendVerificationEmail(cleanEmail, verificationToken, cleanFirstName);
    } catch (emailError) {
      console.error('Email send error:', emailError);
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
