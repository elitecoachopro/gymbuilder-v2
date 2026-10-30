export function createContactSender(url: '/api/contact' | '/api/contact/supplier', fetcher: typeof fetch = fetch) {
  const pending = new Map<string, string>();
  return async (body: Record<string, unknown>) => {
    const signature = JSON.stringify(body);
    const idempotencyKey = pending.get(signature) || crypto.randomUUID();
    pending.set(signature, idempotencyKey);
    const response = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, idempotencyKey }) });
    if (response.ok) pending.delete(signature);
    return response;
  };
}
