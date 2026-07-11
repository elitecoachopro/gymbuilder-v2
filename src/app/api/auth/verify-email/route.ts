import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder-v2.vercel.app';
      return NextResponse.redirect(`${appUrl}/login?error=Token lipsă`);
    }

    const supabase = getSupabaseAdmin();

    // Find user by verification token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('verification_token', token)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder-v2.vercel.app';

    if (error || !user) {
      return NextResponse.redirect(`${appUrl}/login?error=Token invalid sau expirat`);
    }

    // Mark email as verified and clear token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Verify email update error:', updateError);
      return NextResponse.redirect(`${appUrl}/login?error=Eroare la verificare`);
    }

    // Redirect to login with success message
    return NextResponse.redirect(`${appUrl}/login?verified=true`);
  } catch (error) {
    console.error('Verify email error:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder-v2.vercel.app';
    return NextResponse.redirect(`${appUrl}/login?error=Eroare internă`);
  }
}
