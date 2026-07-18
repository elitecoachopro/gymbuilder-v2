import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'contact@gymbuilder.app';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('session_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Sesiune invalidă' }, { status: 401 });
    }

    const { reason } = await request.json().catch(() => ({ reason: '' }));

    // Log the deletion request in the database
    const { error: insertError } = await supabaseAdmin
      .from('account_deletion_requests')
      .insert({
        user_id: decoded.userId,
        user_email: decoded.email,
        user_role: decoded.role,
        reason: reason || null,
        status: 'pending',
      });

    // If table doesn't exist yet, still send the notification email
    if (insertError && !insertError.message.includes('does not exist')) {
      console.error('Error logging deletion request:', insertError);
    }

    // Send notification email to admin
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"GymBuilder" <${process.env.EMAIL_USER || 'noreply@gymbuilder.app'}>`,
        to: ADMIN_EMAIL,
        subject: `[GDPR] Cerere ștergere cont - ${decoded.email}`,
        html: `
          <h2>Cerere de ștergere cont (GDPR Art. 17)</h2>
          <p><strong>Email utilizator:</strong> ${decoded.email}</p>
          <p><strong>ID utilizator:</strong> ${decoded.userId}</p>
          <p><strong>Rol:</strong> ${decoded.role}</p>
          <p><strong>Motiv:</strong> ${reason || 'Nu a fost specificat'}</p>
          <p><strong>Data cererii:</strong> ${new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}</p>
          <hr />
          <p><em>Conform GDPR Art. 17, această cerere trebuie procesată în maxim 30 de zile.</em></p>
        `,
      });
    } catch (emailError) {
      console.error('Email notification failed (deletion request still logged):', emailError);
    }

    return NextResponse.json({
      message: 'Cererea de ștergere a fost înregistrată. Vei primi o confirmare pe email în maxim 30 de zile.',
    });
  } catch (error) {
    console.error('Account deletion request error:', error);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}
