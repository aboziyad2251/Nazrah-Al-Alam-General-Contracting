import { Search, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';
import { format } from 'date-fns';

export function TopBar() {
  const { profile, signOut } = useAuthStore();
  const { setCommandPaletteOpen } = useUiStore();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone/60 bg-white px-4">
      {/* Search / Command palette trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex w-52 items-center gap-2 rounded-lg bg-stone/50 px-3 py-1.5 text-sm text-ink-500 transition-colors hover:bg-stone"
      >
        <Search size={14} />
        <span>Search…</span>
        <kbd className="ml-auto rounded border border-cloud bg-white px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <div className="flex-1" />

      {/* Notifications */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-stone hover:text-ink-900">
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 w-72 rounded-xl border border-stone bg-white py-2 shadow-lg"
            sideOffset={8}
            align="end"
          >
            <div className="border-b border-stone px-3 py-2">
              <p className="text-sm font-semibold text-ink-900">Notifications</p>
            </div>
            {notifications.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-ink-500">All caught up!</p>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} className="cursor-pointer px-3 py-2 hover:bg-stone/40">
                  <p className="text-sm font-medium text-ink-900">{n.title_en}</p>
                  <p className="text-xs text-ink-500">
                    {format(new Date(n.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* User menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-stone">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy">
              <span className="text-xs font-bold text-white">
                {profile?.full_name?.charAt(0) ?? 'A'}
              </span>
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold leading-none text-ink-900">
                {profile?.full_name ?? 'Admin'}
              </p>
              <p
                className={cn(
                  'mt-0.5 text-[10px] leading-none',
                  profile?.role === 'super_admin' ? 'text-gold' : 'text-ink-500'
                )}
              >
                {profile?.role?.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown size={12} className="text-ink-500" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 w-44 rounded-xl border border-stone bg-white py-1 shadow-lg"
            sideOffset={8}
            align="end"
          >
            <DropdownMenu.Item
              className="text-ink-700 mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-stone"
              onSelect={() => navigate('/settings')}
            >
              <User size={14} /> Profile
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 border-t border-stone" />
            <DropdownMenu.Item
              className="mx-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onSelect={handleSignOut}
            >
              <LogOut size={14} /> Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
