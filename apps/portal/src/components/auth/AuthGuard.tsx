import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, setSession, fetchProfile, loading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) fetchProfile(data.session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-cloud">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy border-t-gold" />
      </div>
    );

  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
