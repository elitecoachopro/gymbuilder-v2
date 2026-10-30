import { readFile } from 'node:fs/promises';
import path from 'node:path';
let missing = false;
export async function GET() {
  if (missing) return new Response('Fixture model intentionally unavailable', { status: 404 });
  const root = process.env.GYM_FIXTURE_PUBLIC;
  if (!root) return new Response('Set GYM_FIXTURE_PUBLIC for this fixture', { status: 503 });
  const bytes = await readFile(path.join(root, 'models/gym/pilot/cad_treadmill.glb'));
  return new Response(new Uint8Array(bytes), { headers: { 'Content-Type': 'model/gltf-binary', 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  const value = await request.json();
  if (typeof value.missing !== 'boolean') return Response.json({ error: 'Expected missing boolean' }, { status: 400 });
  missing = value.missing;
  return Response.json({ missing });
}
