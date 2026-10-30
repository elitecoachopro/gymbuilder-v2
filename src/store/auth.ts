'use client';

import { create } from 'zustand';
import { clearEditorDrafts } from '@/lib/gym-editor-draft';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'supplier' | 'admin';
  avatarUrl?: string | null;
}

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await clearEditorDrafts(get().user?.id ?? 'guest').catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_token');
    }
    set({ user: null, isLoading: false });
  },
}));
