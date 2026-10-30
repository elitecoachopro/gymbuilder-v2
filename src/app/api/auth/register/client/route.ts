import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hashPassword } from '@/lib/password';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeString, isValidEmail, isStrongPassword } from '@/lib/sanitize';

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
    const rateCheck = await checkRateLimit(`register:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return await localizedJson(
        { error: 'Toate câmpurile obligatorii trebuie completate.' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const cleanEmail = sanitizeEmail(email);
    const cleanFirstName = sanitizeString(firstName).slice(0, 50);
    const cleanLastName = sanitizeString(lastName).slice(0, 50);

    // Validate email
    if (!isValidEmail(cleanEmail)) {
      return await localizedJson(
        { error: 'Adresa de email nu este validă.' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return await localizedJson(
        { error: passwordCheck.message },
        { status: 400 }
      );
    }

    // Validate name length
    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      return await localizedJson(
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
      return await localizedJson(
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
        verification_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, email, full_name')
      .single();

    if (insertError) {
      console.error('User creation error:', insertError);
      return await localizedJson(
        { error: 'Eroare la crearea contului. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Email delivery is independent from successful account creation.
    let emailSent = false;
    try {
      await sendVerificationEmail(cleanEmail, verificationToken, cleanFirstName);
      emailSent = true;
    } catch (emailError) {
      console.error('Email send error:', emailError);
    }

    return await localizedJson({
      success: true,
      emailSent,
      message: emailSent ? 'Cont creat cu succes! Verifică emailul pentru a confirma adresa.' : 'Cont creat. Emailul de confirmare nu a putut fi trimis. Poti solicita retrimiterea din pagina de autentificare.',
      user: { id: newUser.id, email: newUser.email, name: newUser.full_name },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return await localizedJson(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
