import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/session-server';
import TrafficCounters from '@/components/TrafficCounters';

export const metadata: Metadata = { title: 'Gym Builder · Statistici / Statistics', robots: { index: false, follow: false } };

export default async function StatisticsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?redirect=%2Fstatistici');
  if (user.role !== 'admin' && user.role !== 'supplier') redirect('/client/dashboard');
  const en = (await cookies()).get('locale')?.value === 'en';
  return <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 pb-24 sm:px-6">
    <Link href={user.role === 'admin' ? '/admin' : '/supplier/dashboard'} className="mb-4 inline-flex min-h-11 items-center text-sm text-gold-400">← {en ? 'Back to dashboard' : 'Înapoi la dashboard'}</Link>
    <h1 className="mb-2 text-3xl font-bold">{en ? 'Gym Builder statistics' : 'Statistici Gym Builder'}</h1>
    <p className="mb-6 text-sm text-anthracite-300">{en ? 'Private report · only data allowed for your account.' : 'Raport privat · numai datele permise contului tău.'}</p>
    <TrafficCounters audience={user.role} standalone />
  </main>;
}
