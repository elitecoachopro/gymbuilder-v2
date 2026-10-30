'use client';
import { useAuthStore } from '@/store/auth';
export async function logoutClient() {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  if (!res.ok) throw new Error('Deconectarea nu a reușit. Încearcă din nou.');
  await useAuthStore.getState().logout();
}
