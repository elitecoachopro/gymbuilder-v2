import { localizedJson } from '@/lib/json-response';
import { NextRequest } from 'next/server';
import { GET as products } from '../route';
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.searchParams.set('limit', '1');
  const response = await products(new NextRequest(url));
  const body = await response.json();
  return await localizedJson({ count: body.count || 0 }, { status: response.status });
}
