import { sendTransactionalEmail } from './transactional-email.ts';

export async function sendSupplierEmail(to: string, subject: string, html: string, apiKey: string | undefined): Promise<boolean> {
  if (!apiKey) return false;
  try { await sendTransactionalEmail(to, subject, html, apiKey); return true; } catch { return false; }
}

export function supplierDecisionResult(company: string, action: 'approve' | 'reject', emailSent: boolean) {
  return {
    success: true,
    emailSent,
    message: `Furnizorul "${company}" a fost ${action === 'approve' ? 'aprobat' : 'respins'}. ${emailSent ? 'Notificarea email a fost acceptată pentru trimitere.' : 'Notificarea email nu a putut fi trimisă.'}`,
  };
}
