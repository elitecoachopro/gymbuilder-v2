import { chatFixture } from '../../../chat-state';
export async function POST(request: Request) {
  const value = await request.json();
  if (value.incoming) chatFixture.messages.push({ id: crypto.randomUUID(), sender_type: 'supplier', sender_name: 'Furnizor de test', content: String(value.incoming), created_at: new Date().toISOString() });
  for (const key of ['failGet', 'failPost', 'slowPost'] as const) if (typeof value[key] === 'boolean') chatFixture[key] = value[key];
  return Response.json({ success: true });
}
