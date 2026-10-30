import { fixtureOwner, persistenceFixture as store } from '../../../persistence-state';
import { validStudioProject } from '../../../../../src/lib/gym-studio';
export async function GET() {
  const owner = await fixtureOwner();
  if (owner === 'expired') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ projects: store.projects.filter(project => project.client_id === owner), saves: store.saves });
}
export async function POST(request: Request) {
  const owner = await fixtureOwner();
  if (owner === 'expired') return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const value = await request.json();
  if (store.delay || value.name.includes('TEST_DELAY')) await new Promise(resolve => setTimeout(resolve, store.delay || 1500));
  if (store.failure) { const status = store.failure; store.failure = 0; return Response.json({ error: 'Fixture save failure' }, { status }); }
  const existing = store.projects.find(project => project.id === value.id);
  if (value.id && (!existing || existing.client_id !== owner)) return Response.json({ error: 'Project not found' }, { status: 404 });
  const project = { ...existing, ...value, id: value.id ?? crypto.randomUUID(), name: value.name.trim(), client_id: owner };
  // Seed helpers omit marketing dimensions; real Workbench saves include them.
  if (value.total_area && !validStudioProject(project)) return Response.json({ error: 'Invalid geometry' }, { status: 400 });
  const index = store.projects.findIndex(existing => existing.id === project.id);
  if (index < 0) store.projects.push(project); else store.projects[index] = project;
  store.saves++;
  return Response.json({ project });
}
