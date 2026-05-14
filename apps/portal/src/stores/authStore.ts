import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  full_name: string | null;
  full_name_ar: string | null;
  phone: string | null;
  company: string | null;
  role: 'client' | 'premium_client' | 'operator' | 'dispatcher' | 'admin' | 'super_admin';
  locale: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
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
        if (data) set({ profile: data as Profile });
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, profile: null });
      },
    }),
    {
      name: 'nazrah-auth',
      partialize: (s) => ({ profile: s.profile }),
    }
  )
);
