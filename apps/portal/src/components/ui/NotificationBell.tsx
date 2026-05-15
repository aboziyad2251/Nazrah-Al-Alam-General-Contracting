import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';

interface Notification {
  id: number;
  type: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  quote_sent: '📄',
  quote_accepted: '✅',
  quote_rejected: '❌',
  booking_confirmed: '📦',
  booking_started: '🚧',
  booking_completed: '🏁',
  booking_cancelled: '🚫',
  invoice_issued: '🧾',
  invoice_overdue: '⚠️',
  invoice_paid: '💚',
};

export function NotificationBell() {
  const { user } = useAuthStore();
  const { locale } = useUIStore();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = useMutation({
    mutationFn: async (ids: number[]) => {
      await supabase.from('notifications').update({ read: true }).in('id', ids);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const markAll = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length) markRead.mutate(unreadIds);
  };

  // Real-time: subscribe to new rows for this profile
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-' + user.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ['notifications', user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    setOpen((v) => !v);
    // mark all read when opening
    if (!open) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length) markRead.mutate(unreadIds);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-cloud"
        aria-label="Notifications"
      >
        <Bell size={18} className={cn('text-ink-500', unread > 0 && 'text-navy')} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 top-11 z-50 w-80 rounded-2xl border border-stone bg-white shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone px-4 py-3">
            <span className="text-sm font-semibold text-navy">
              {locale === 'ar' ? 'الإشعارات' : 'Notifications'}
            </span>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={markAll}
                className="flex items-center gap-1 text-xs text-ink-500 hover:text-navy"
              >
                <CheckCheck size={13} />
                {locale === 'ar' ? 'تعيين الكل كمقروء' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-500">
                {locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications yet'}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'border-b border-stone/50 px-4 py-3 last:border-0',
                    !n.read && 'bg-cloud/60'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg leading-none">{TYPE_ICON[n.type] ?? '🔔'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy">
                        {locale === 'ar' ? n.title_ar : n.title_en}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
                        {locale === 'ar' ? n.body_ar : n.body_en}
                      </p>
                      <p className="text-ink-400 mt-1 text-[10px]">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
