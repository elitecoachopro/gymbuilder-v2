import type { Database } from '@/types/database.generated';
import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { registrationSession, registrationBucket, registrationCookie } from '@/lib/registration-upload-server';
import { hashPassword } from '@/lib/password';
import { parsePublicContactEmail } from '@/lib/supplier-contact';
import { sendVerificationEmail, sendSupplierWelcomeEmail } from '@/lib/email';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeEmail, sanitizeString, sanitizePhone, sanitizeUrl, isValidEmail, isStrongPassword } from '@/lib/sanitize';

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
    const rateCheck = await checkRateLimit(`register-supplier:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const {
      email,
      contactEmail,
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
      verificationPhotos,
    } = body;

    // Validation
    if (!email || !password || !firstName || !lastName || !companyName || !country || !city || !phone) {
      return await localizedJson(
        { error: 'Toate câmpurile obligatorii trebuie completate (inclusiv telefon).' },
        { status: 400 }
      );
    }

    const publicContactEmail = parsePublicContactEmail(contactEmail);
    if (!publicContactEmail.valid) {
      return await localizedJson({ error: 'Emailul public de contact nu este valid.' }, { status: 400 });
    }

    // Validate verification photos (min 3)
    if (!verificationPhotos || !Array.isArray(verificationPhotos) || verificationPhotos.length < 3 || verificationPhotos.length > 10) {
      return await localizedJson(
        { error: 'Trebuie să încărcați minim 3 poze de verificare (showroom/depozit).' },
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
    const cleanPhone = sanitizePhone(phone).slice(0, 20);
    const cleanDescription = description ? sanitizeString(description).slice(0, 1000) : null;
    const uploadSession = await registrationSession();
    if (!uploadSession) return await localizedJson({ error: 'Sesiunea de încărcare a expirat.' }, { status: 400 });
    const cleanPhotos: string[] = verificationPhotos;
    const prefix = `${uploadSession.id}/`;
    if (new Set(cleanPhotos).size !== cleanPhotos.length || cleanPhotos.some(path => typeof path !== 'string' || !path.startsWith(prefix) || !/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(path.slice(prefix.length)))) {
      return await localizedJson({ error: 'Poze de verificare invalide.' }, { status: 400 });
    }
    const { data: uploadedFiles, error: filesError } = await getSupabaseAdmin().storage.from(registrationBucket).list(uploadSession.id);
    if (filesError || cleanPhotos.some(path => !uploadedFiles?.some(file => file.name === path.slice(prefix.length)))) {
      return await localizedJson({ error: 'Pozele de verificare nu au fost găsite.' }, { status: 400 });
    }

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

    // Validate names
    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      return await localizedJson(
        { error: 'Numele trebuie să aibă minim 2 caractere.' },
        { status: 400 }
      );
    }

    if (cleanCompanyName.length < 2) {
      return await localizedJson(
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
      return await localizedJson(
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
        verification_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, email, full_name')
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return await localizedJson(
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
        contact_email: publicContactEmail.email,
        description: cleanDescription,
        status: 'pending',
        plan: 'free',
        requested_plan: selectedPlan,
        verification_photos: cleanPhotos,
      });

    if (profileError) {
      console.error('Supplier profile creation error:', profileError);
      await supabase.from('users').delete().eq('id', newUser.id);
      return await localizedJson(
        { error: 'Eroare la crearea profilului de furnizor. Încearcă din nou.' },
        { status: 500 }
      );
    }

    const { data: claimed, error: claimError } = await supabase.from('registration_upload_sessions')
      .update({ claimed_by: newUser.id, expires_at: new Date().toISOString() }).eq('id', uploadSession.id).is('claimed_by', null)
      .gt('expires_at', new Date().toISOString()).select('id').maybeSingle();
    if (claimError || !claimed) {
      await supabase.from('users').delete().eq('id', newUser.id);
      return await localizedJson({ error: 'Sesiunea de încărcare a expirat sau a fost deja folosită.' }, { status: 409 });
    }

    // Email delivery is independent from successful account creation.
    let emailSent = false;
    try {
      await sendVerificationEmail(cleanEmail, verificationToken, cleanFirstName);
      emailSent = true;
    } catch (emailError) {
      console.error('Verification email error:', emailError);
    }

    // Send supplier welcome email
    try {
      await sendSupplierWelcomeEmail(cleanEmail, cleanFirstName, cleanCompanyName);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }

    const response = await localizedJson({
      success: true,
      emailSent,
      message: emailSent ? 'Înregistrare furnizor completă! Verifică emailul pentru confirmare. Profilul va fi aprobat de echipa noastră.' : 'Cont furnizor creat. Confirmarea emailului nu a putut fi trimisa. Solicita retrimiterea din pagina de autentificare; profilul asteapta aprobarea echipei.',
      user: { id: newUser.id, email: newUser.email, name: newUser.full_name },
    });
    response.cookies.delete(registrationCookie);
    return response;
  } catch (error) {
    console.error('Supplier registration error:', error);
    return await localizedJson(
      { error: 'Eroare internă. Încearcă din nou.' },
      { status: 500 }
    );
  }
}
