import { localizedJson } from '@/lib/json-response';
import { getSessionUser } from '@/lib/session-server';

export async function GET() {
  const user = await getSessionUser();
  return await localizedJson({ user: user ? { id: user.id, email: user.email, full_name: user.full_name, role: user.role } : null });
}
