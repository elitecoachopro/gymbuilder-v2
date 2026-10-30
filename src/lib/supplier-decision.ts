export async function sendSupplierEmail(to: string, subject: string, html: string, apiKey: string | undefined): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Gym Builder <contact@gymbuilder.app>', to: [to], subject, html }),
    });
    return response.ok;
  } catch { return false; }
}

export function supplierDecisionResult(company: string, action: 'approve' | 'reject', emailSent: boolean) {
  return {
    success: true,
    emailSent,
    message: `Furnizorul "${company}" a fost ${action === 'approve' ? 'aprobat' : 'respins'}. ${emailSent ? 'Notificarea email a fost acceptată pentru trimitere.' : 'Notificarea email nu a putut fi trimisă.'}`,
  };
}
