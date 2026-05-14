import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const ALLOWED_ROLES = ['admin', 'super_admin'] as const;

export function AdminGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { setSession, fetchProfile, profile, loading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else navigate('/login', { replace: true });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      else navigate('/login', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading && !profile) {
    return (
      <div className="bg-sidebar flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-white/60">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  const role = profile?.role;
  if (role && !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return (
      <div className="bg-sidebar flex h-screen items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-2 text-2xl font-bold">Access Denied</p>
          <p className="text-sm text-white/60">You do not have admin privileges.</p>
          <button
            onClick={() => {
              useAuthStore.getState().signOut();
              navigate('/login');
            }}
            className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
