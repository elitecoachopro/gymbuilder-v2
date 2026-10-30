import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session-server';
import AdminDashboard from '@/components/admin/AdminDashboard';
export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?redirect=%2Fadmin');
  if (user.role !== 'admin') redirect(user.role === 'supplier' ? '/supplier/dashboard' : '/client/dashboard');
  return <AdminDashboard />;
}
