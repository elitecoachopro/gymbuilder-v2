import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export async function generateMetadata(): Promise<Metadata> {
  const en = (await cookies()).get('locale')?.value === 'en';
  return {
    title: en ? 'Gym Service & Maintenance | Gym Builder' : 'Gym Service și Mentenanță | Gym Builder',
    description: en ? 'Find fitness equipment repair, maintenance and installation providers. Search services and coverage areas, then contact the provider directly.' : 'Găsește prestatori pentru reparații, mentenanță și montaj aparate fitness. Alege serviciul și zona, apoi contactează direct prestatorul.',
  };
}
export default function ServiceLayout({ children }: { children: React.ReactNode }) { return children; }
