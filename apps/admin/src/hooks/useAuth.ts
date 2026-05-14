import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const { user, profile, session } = useAuthStore();

  const role = profile?.role ?? null;
  const isAdmin = role === 'admin' || role === 'super_admin';
  const isPremium = role === 'premium_client' || isAdmin;

  const loginWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const logout = () => useAuthStore.getState().signOut();

  return { user, profile, session, role, isAdmin, isPremium, login: loginWithGoogle, logout };
}
