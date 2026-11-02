import { NextRequest, NextResponse } from 'next/server';

const events: { path: string; eventId: string; sessionId: string; status: number; recorded: boolean }[] = [];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const upstream = await fetch('http://127.0.0.1:3042/api/analytics/view', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const result = await upstream.json();
  events.push({ path: body.path, eventId: body.eventId, sessionId: body.sessionId, status: upstream.status, recorded: result.recorded === true });
  if (events.length > 20) events.shift();
  return NextResponse.json(result, { status: upstream.status });
}
export async function GET() { return NextResponse.json({ events }); }
