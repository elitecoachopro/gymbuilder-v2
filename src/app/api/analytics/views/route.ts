import { recordPageView } from '@/lib/analytics-server';

export async function POST(request: Request) { return recordPageView(request); }
