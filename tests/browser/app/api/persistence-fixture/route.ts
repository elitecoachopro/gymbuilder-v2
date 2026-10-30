import { NextResponse } from 'next/server';
import { fixtureOwner, persistenceFixture } from '../../../persistence-state';
export async function GET() {
  return NextResponse.json({ owner: await fixtureOwner() }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  const { owner, failure, delay } = await request.json();
  if (failure !== undefined) persistenceFixture.failure = [0, 500, 404].includes(failure) ? failure : 0;
  if (delay !== undefined) persistenceFixture.delay = Math.min(5000, Math.max(0, Number(delay) || 0));
  const response = NextResponse.json({ configured: true });
  if (owner && ['fixture-a','fixture-b','expired'].includes(owner)) response.cookies.set('gym-fixture-owner', owner, { httpOnly: true, sameSite: 'strict', path: '/' });
  return response;
}
