import { chatFixture } from '../../../chat-state';
export async function GET() {
  return chatFixture.failGet ? Response.json({ error: 'Fixture GET failure' }, { status: 503 }) : Response.json({ messages: chatFixture.messages });
}
export async function POST(request: Request) {
  const { content } = await request.json();
  if (chatFixture.failPost) return Response.json({ error: 'Fixture POST failure' }, { status: 503 });
  if (chatFixture.slowPost) await new Promise(resolve => setTimeout(resolve, 2000));
  const message = { id: crypto.randomUUID(), sender_type: 'client', sender_name: 'Client de test', content: String(content), created_at: new Date().toISOString() };
  chatFixture.messages.push(message);
  return Response.json({ message });
}
