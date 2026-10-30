import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { getClientIP } from '@/lib/rate-limit';
import { registrationSession, registrationCookie, registrationDatabase, tokenHash } from '@/lib/registration-upload-server';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && getClientIP(request) === 'unknown') return await localizedJson({ error: 'Configurarea proxy-ului pentru upload lipsește.' }, { status: 503 });
  const database = registrationDatabase();
  const { data: expired } = await database.from('registration_upload_sessions').select('id').is('claimed_by', null).lt('expires_at', new Date().toISOString()).limit(10);
  for (const session of expired || []) {
    const { data: files, error: listError } = await database.storage.from('registration-verifications').list(session.id);
    if (listError) continue;
    if (files?.length) {
      const { error } = await database.storage.from('registration-verifications').remove(files.map(file => `${session.id}/${file.name}`));
      if (error) continue;
    }
    await database.from('registration_upload_sessions').delete().eq('id', session.id).is('claimed_by', null);
  }
  if (await registrationSession()) return await localizedJson({ ready: true });
  const token = crypto.randomBytes(32).toString('hex');
  const secret = process.env.AUTH_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const ipHash = crypto.createHmac('sha256', secret).update(getClientIP(request)).digest('hex');
  const { error } = await registrationDatabase().rpc('issue_registration_upload', { p_token_hash: tokenHash(token), p_ip_hash: ipHash });
  if (error) return await localizedJson({ error: 'Limita sesiunilor de upload a fost atinsa. Incearca mai tarziu.' }, { status: error.code === '23514' ? 429 : 500 });
  const response = await localizedJson({ ready: true, maxFiles: 10 }, { status: 201 });
  response.cookies.set(registrationCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 3600 });
  return response;
}

// Recover this browser's private photos after refreshing the registration form.
export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  const session = await registrationSession();
  if (!session) return await localizedJson({ photos: [] }, { headers });
  const database = registrationDatabase();
  const { data: files, error } = await database.storage.from('registration-verifications').list(session.id, { limit: 10 });
  if (error) return await localizedJson({ error: 'Previzualizarea nu a putut fi creata.' }, { status: 503, headers });
  const photos = [];
  for (const file of files || []) {
    const path = `${session.id}/${file.name}`;
    const { data, error: previewError } = await database.storage.from('registration-verifications').createSignedUrl(path, 3600);
    if (previewError || !data) return await localizedJson({ error: 'Previzualizarea nu a putut fi creata.' }, { status: 503, headers });
    photos.push({ path, url: data.signedUrl });
  }
  return await localizedJson({ photos }, { headers });
}
