import { recordTraffic } from '@/lib/analytics-server';

export async function POST(request: Request) { return recordTraffic(request); }
