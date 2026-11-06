import { escapeEmailHtml, sendTransactionalEmail } from './transactional-email.ts';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.gymbuilder.app';
function template(title: string, content: string) {
  return `<html lang="ro"><body style="margin:0;background:#f7f7f7;color:#202020;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px"><p style="font-weight:bold">Gym Builder</p><h1 style="font-size:22px">${title}</h1>${content}<p>Ai nevoie de ajutor? Răspunde la acest mesaj sau scrie la contact@gymbuilder.app.</p><p>Echipa Gym Builder</p></div></body></html>`;
}
export function sendVerificationEmail(email: string, token: string, name: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendTransactionalEmail(email, 'Confirmă adresa de email - Gym Builder', template('Confirmă adresa de email', `<p>Salut ${escapeEmailHtml(name)},</p><p>Ai creat un cont Gym Builder. Pentru a confirma adresa de email, folosește linkul de mai jos:</p><p><a href="${escapeEmailHtml(url)}">Confirmă adresa de email</a></p><p>Linkul expiră în 24 de ore. Dacă nu ai solicitat acest cont, poți ignora mesajul.</p>`));
}
export function sendPasswordResetEmail(email: string, token: string, name: string) {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendTransactionalEmail(email, 'Resetare parolă - Gym Builder', template('Resetare parolă', `<p>Salut ${escapeEmailHtml(name)},</p><p>Am primit o solicitare de resetare a parolei contului tău.</p><p><a href="${escapeEmailHtml(url)}">Alege o parolă nouă</a></p><p>Linkul expiră într-o oră. Dacă nu ai făcut solicitarea, poți ignora mesajul; parola rămâne neschimbată.</p>`));
}
export function sendSupplierWelcomeEmail(email: string, name: string, companyName: string) {
  return sendTransactionalEmail(email, 'Înregistrare furnizor primită - Gym Builder', template('Înregistrarea a fost primită', `<p>Salut ${escapeEmailHtml(name)},</p><p>Am primit înregistrarea companiei ${escapeEmailHtml(companyName)}. Confirmă adresa folosind mesajul separat de confirmare. Echipa Gym Builder va verifica profilul și vei primi rezultatul prin email înainte de publicare.</p>`));
}
export function sendSupplierApprovalEmail(email: string, name: string, companyName: string, businessType: string) {
 const activity=businessType==='service'?'serviciile de service și mentenanță':businessType==='both'?'echipamentele și serviciile oferite':'echipamentele';
 const url=`${APP_URL}/supplier/dashboard`;
 return sendTransactionalEmail(email,'Contul tau Gym Builder a fost aprobat',template('Profilul de furnizor a fost aprobat',`<p>Salut ${escapeEmailHtml(name)},</p><p>Profilul companiei ${escapeEmailHtml(companyName)} este aprobat pe Gym Builder. Poți prezenta ${activity}, gestiona profilul și primi cereri de la clienți.</p><p><a href="${escapeEmailHtml(url)}">Deschide contul de furnizor</a></p>`));
}
