import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { registrationSession, registrationDatabase, registrationBucket } from '@/lib/registration-upload-server';

const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
function validImage(buffer: Buffer, type: string) {
  if (type === 'image/jpeg') return buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (type === 'image/png') return buffer.length >= 8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  return type === 'image/webp' && buffer.length >= 12 && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP';
}

export async function POST(request: NextRequest) {
  const session = await registrationSession();
  if (!session) return await localizedJson({ error: 'Sesiune de upload invalida sau expirata.' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || !types[file.type] || file.size < 1 || file.size > 5242880) return await localizedJson({ error: 'Imagine invalida sau mai mare de 5MB.' }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validImage(buffer,file.type)) return await localizedJson({ error: 'Semnatura imaginii nu corespunde formatului.' }, { status: 400 });
  const database = registrationDatabase();
  const { data: reserved, error: quotaError } = await database.rpc('reserve_registration_upload', { p_token_hash: session.hash });
  if (quotaError || !reserved) return await localizedJson({ error: 'Limita de 10 poze a fost atinsa sau sesiunea a expirat.' }, { status: 429 });
  const path = `${session.id}/${crypto.randomUUID()}.${types[file.type]}`;
  const { error } = await database.storage.from(registrationBucket).upload(path,buffer,{contentType:file.type});
  if (error) {
    await database.rpc('release_registration_upload',{p_session_id:session.id});
    return await localizedJson({ error: 'Imaginea nu a putut fi salvata.' },{status:500});
  }
  const { data: preview, error: previewError } = await database.storage.from(registrationBucket).createSignedUrl(path,3600);
  if (previewError || !preview) {
    await database.storage.from(registrationBucket).remove([path]);
    await database.rpc('release_registration_upload',{p_session_id:session.id});
    return await localizedJson({error:'Previzualizarea nu a putut fi creata.'},{status:500});
  }
  return await localizedJson({success:true,path,url:preview.signedUrl});
}

export async function DELETE(request: NextRequest) {
  const session = await registrationSession();
  if (!session) return await localizedJson({error:'Sesiune invalida.'},{status:401});
  const body = await request.json().catch(()=>null);
  const path = body?.path;
  if (typeof path !== 'string' || !new RegExp(`^${session.id}/[a-f0-9-]{36}\\.(jpg|png|webp)$`).test(path)) return await localizedJson({error:'Fisier invalid.'},{status:400});
  const database = registrationDatabase();
  const { data: files } = await database.storage.from(registrationBucket).list(session.id);
  if (!(files || []).some(file => `${session.id}/${file.name}` === path)) return await localizedJson({error:'Fisier negasit.'},{status:404});
  const { error } = await database.storage.from(registrationBucket).remove([path]);
  if (error) return await localizedJson({error:'Fisierul nu a putut fi sters.'},{status:500});
  await database.rpc('release_registration_upload',{p_session_id:session.id});
  return await localizedJson({success:true});
}
