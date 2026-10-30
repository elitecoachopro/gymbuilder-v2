import { cookies } from 'next/headers';
type Project = Record<string, unknown> & { id: string; name: string; client_id: string };
const runtime = globalThis as typeof globalThis & { gymPersistenceFixture?: { projects: Project[]; saves: number; failure: number; delay: number } };
export const persistenceFixture = runtime.gymPersistenceFixture ??= { projects: [], saves: 0, failure: 0, delay: 0 };
export async function fixtureOwner() { return (await cookies()).get('gym-fixture-owner')?.value ?? 'fixture-a'; }
