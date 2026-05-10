import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AdminProfile {
  id: string;
  full_name: string | null;
  full_name_ar: string | null;
  phone: string | null;
  company: string | null;
  role: 'client' | 'operator' | 'dispatcher' | 'admin' | 'super_admin';
  locale: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: AdminProfile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: AdminProfile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      loading: true,

      setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),

      setProfile: (profile) => set({ profile }),

      fetchProfile: async (userId) => {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) set({ profile: data as AdminProfile });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null });
      },
    }),
    {
      name: 'nazrah-admin-auth',
      partialize: (s) => ({ profile: s.profile }),
    }
  )
);
