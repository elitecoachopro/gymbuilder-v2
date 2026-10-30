import { chatFixture } from '../../../chat-state';
export async function POST(request: Request) {
  const value = await request.json();
  for (const key of ['failGet', 'failPost', 'slowPost'] as const) if (typeof value[key] === 'boolean') chatFixture[key] = value[key];
  return Response.json({ success: true });
}
