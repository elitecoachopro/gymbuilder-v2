'use client';

import { create } from 'zustand';

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
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session_token');
    }
    set({ user: null, isLoading: false });
  },
}));
