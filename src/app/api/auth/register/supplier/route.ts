import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hashPassword } from '@/lib/password';
import { sendVerificationEmail, sendSupplierWelcomeEmail } from '@/lib/email';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
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

    const validPlans = ['free', 'starter', 'professional', 'enterprise'];
    const selectedPlan = validPlans.includes(plan) ? plan : 'free';

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

    // Create user with supplier role
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: `${firstName} ${lastName}`,
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
        company_name: companyName,
        country,
        city,
        website: website || null,
        phone: phone || null,
        description: description || null,
        status: 'pending',
        plan: selectedPlan,
      });

    if (profileError) {
      console.error('Supplier profile creation error:', profileError);
      // Cleanup: delete the user if profile creation fails
      await supabase.from('users').delete().eq('id', newUser.id);
      return NextResponse.json(
        { error: 'Eroare la crearea profilului de furnizor. Încearcă din nou.' },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(email.toLowerCase(), verificationToken, firstName);
    } catch (emailError) {
      console.error('Verification email error:', emailError);
    }

    // Send supplier welcome email
    try {
      await sendSupplierWelcomeEmail(email.toLowerCase(), firstName, companyName);
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
