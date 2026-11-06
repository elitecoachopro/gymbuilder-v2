export const GYM_EMAIL_FROM = 'Gym Builder <contact@gymbuilder.app>';
export const GYM_EMAIL_REPLY_TO = 'contact@gymbuilder.app';

export function escapeEmailHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function emailPlainText(html: string) {
  return html.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<(br\s*\/?|\/p|\/div|\/h[1-6]|\/li)>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(?:39|x27);/gi, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
export async function sendTransactionalEmail(to: string, subject: string, html: string, apiKey = process.env.RESEND_API_KEY) {
  if (!apiKey) throw new Error('EMAIL_NOT_CONFIGURED');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: GYM_EMAIL_FROM, reply_to: GYM_EMAIL_REPLY_TO, to: [to], subject, html, text: emailPlainText(html) }),
  });
  if (!response.ok) throw new Error('EMAIL_PROVIDER_REJECTED');
  const data = await response.json();
  if (!data || typeof data.id !== 'string' || !data.id) throw new Error('EMAIL_PROVIDER_INVALID_RESPONSE');
  return { id: data.id as string };
}
