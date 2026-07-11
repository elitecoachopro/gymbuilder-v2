import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'GymBuilder <noreply@gymbuilder.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gymbuilder-v2.vercel.app';

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Confirmă adresa de email - GymBuilder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c518; margin: 0;">GymBuilder</h1>
        </div>
        <h2 style="color: #ffffff; margin-bottom: 20px;">Bine ai venit, ${name}!</h2>
        <p style="color: #cccccc; line-height: 1.6;">
          Mulțumim pentru înregistrare. Te rugăm să confirmi adresa de email făcând click pe butonul de mai jos:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #f5c518; color: #1a1a1a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Confirmă Email
          </a>
        </div>
        <p style="color: #999999; font-size: 12px; margin-top: 30px;">
          Dacă nu ai creat un cont pe GymBuilder, poți ignora acest email.
        </p>
        <p style="color: #999999; font-size: 12px;">
          Link-ul expiră în 24 de ore.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Resetare parolă - GymBuilder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c518; margin: 0;">GymBuilder</h1>
        </div>
        <h2 style="color: #ffffff; margin-bottom: 20px;">Resetare parolă</h2>
        <p style="color: #cccccc; line-height: 1.6;">
          Salut ${name}, am primit o cerere de resetare a parolei pentru contul tău. Apasă butonul de mai jos pentru a seta o parolă nouă:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #f5c518; color: #1a1a1a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Resetează Parola
          </a>
        </div>
        <p style="color: #999999; font-size: 12px; margin-top: 30px;">
          Dacă nu ai solicitat resetarea parolei, poți ignora acest email.
        </p>
        <p style="color: #999999; font-size: 12px;">
          Link-ul expiră în 1 oră.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send reset email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}

export async function sendSupplierWelcomeEmail(email: string, name: string, companyName: string) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Înregistrare furnizor primită - GymBuilder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 40px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f5c518; margin: 0;">GymBuilder</h1>
        </div>
        <h2 style="color: #ffffff; margin-bottom: 20px;">Bine ai venit, ${name}!</h2>
        <p style="color: #cccccc; line-height: 1.6;">
          Înregistrarea companiei <strong>${companyName}</strong> a fost primită cu succes.
        </p>
        <p style="color: #cccccc; line-height: 1.6;">
          Echipa noastră va verifica datele și vei primi un email de confirmare în maxim 24-48 de ore.
        </p>
        <p style="color: #cccccc; line-height: 1.6;">
          Între timp, te rugăm să confirmi adresa de email pentru a activa contul.
        </p>
        <div style="background: #2a2a2a; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #f5c518; font-weight: bold; margin: 0 0 10px 0;">Status cont:</p>
          <p style="color: #cccccc; margin: 0;">📧 Email: În așteptare confirmare</p>
          <p style="color: #cccccc; margin: 5px 0 0 0;">✅ Profil: Trimis spre aprobare</p>
        </div>
        <p style="color: #999999; font-size: 12px; margin-top: 30px;">
          Echipa GymBuilder
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send supplier welcome email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
