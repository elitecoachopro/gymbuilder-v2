import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hashPassword } from '@/lib/password';
import { sendVerificationEmail, sendSupplierWelcomeEmail } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeString, sanitizePhone, sanitizeUrl, isValidEmail, isStrongPassword } from '@/lib/sanitize';

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
    const rateCheck = checkRateLimit(`register-supplier:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      companyName,
      country,
      city,
      website,
      phone,
      description,
      plan,
    } = body;

    // Validation
    if (!email || !password || !firstName || !lastName || !companyName || !country || !city) {
      return NextResponse.json(
        { error: 'Toate câmpurile obligatorii trebuie completate.' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const cleanEmail = sanitizeEmail(email);
    const cleanFirstName = sanitizeString(firstName).slice(0, 50);
    const cleanLastName = sanitizeString(lastName).slice(0, 50);
    const cleanCompanyName = sanitizeString(companyName).slice(0, 100);
    const cleanCountry = sanitizeString(country).slice(0, 50);
    const cleanCity = sanitizeString(city).slice(0, 50);
    const cleanWebsite = website ? sanitizeUrl(website) : null;
    const cleanPhone = phone ? sanitizePhone(phone).slice(0, 20) : null;
    const cleanDescription = description ? sanitizeString(description).slice(0, 1000) : null;

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

    // Validate names
    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      return NextResponse.json(
        { error: 'Numele trebuie să aibă minim 2 caractere.' },
        { status: 400 }
      );
    }

    if (cleanCompanyName.length < 2) {
      return NextResponse.json(
        { error: 'Numele companiei trebuie să aibă minim 2 caractere.' },
        { status: 400 }
      );
    }

    const validPlans = ['free', 'starter', 'professional', 'enterprise'];
    const selectedPlan = validPlans.includes(plan) ? plan : 'free';

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

    // Create user with supplier role
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: cleanEmail,
        password_hash: passwordHash,
        full_name: `${cleanFirstName} ${cleanLastName}`,
        role: 'supplier',
        email_verified: false,
        verification_token: verificationToken,
      })
      .select('id, email, full_name')
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Eroare la crearea contului. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Create supplier profile
    const { error: profileError } = await supabase
      .from('supplier_profiles')
      .insert({
        user_id: newUser.id,
        company_name: cleanCompanyName,
        country: cleanCountry,
        city: cleanCity,
        website: cleanWebsite,
        phone: cleanPhone,
        description: cleanDescription,
        status: 'pending',
        plan: selectedPlan,
      });

    if (profileError) {
      console.error('Supplier profile creation error:', profileError);
      await supabase.from('users').delete().eq('id', newUser.id);
      return NextResponse.json(
        { error: 'Eroare la crearea profilului de furnizor. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(cleanEmail, verificationToken, cleanFirstName);
    } catch (emailError) {
      console.error('Verification email error:', emailError);
    }

    // Send supplier welcome email
    try {
      await sendSupplierWelcomeEmail(cleanEmail, cleanFirstName, cleanCompanyName);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Înregistrare furnizor completă! Verifică emailul pentru confirmare. Profilul va fi aprobat de echipa noastră.',
      user: { id: newUser.id, email: newUser.email, name: newUser.full_name },
    });
  } catch (error) {
    console.error('Supplier registration error:', error);
    return NextResponse.json(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
