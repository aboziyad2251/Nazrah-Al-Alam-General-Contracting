import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Shield, Crown, User, Search, Loader2 } from 'lucide-react';

type UserRole = 'client' | 'premium_client' | 'operator' | 'dispatcher' | 'admin' | 'super_admin';

interface UserRow {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  locale: string;
  created_at: string;
  last_sign_in: string | null;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'client',            label: 'Client' },
  { value: 'premium_client',    label: 'Premium Client' },
  { value: 'operator',          label: 'Operator' },
  { value: 'dispatcher',        label: 'Dispatcher' },
  { value: 'admin',             label: 'Admin' },
  { value: 'super_admin',       label: 'Super Admin' },
];

const ROLE_BADGE: Record<UserRole, string> = {
  client:            'bg-ink-100 text-ink-600',
  premium_client:    'bg-gold/20 text-amber-700',
  operator:          'bg-blue-100 text-blue-700',
  dispatcher:        'bg-purple-100 text-purple-700',
  admin:             'bg-navy/10 text-navy',
  super_admin:       'bg-red-100 text-red-700',
};

function RoleIcon({ role }: { role: UserRole }) {
  if (role === 'admin' || role === 'super_admin') return <Shield size={12} />;
  if (role === 'premium_client') return <Crown size={12} />;
  return <User size={12} />;
}

export default function UsersListPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [changingId, setChangingId] = useState<string | null>(null);
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_users_with_email');
      if (error) throw error;
      return data as UserRow[];
    },
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role, reason }: { id: string; role: UserRole; reason?: string }) => {
      const { error } = await supabase.rpc('admin_change_role', {
        target_id: id,
        new_role: role,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      toast.success('Role updated');
      setChangingId(null);
      setReasonMap((p) => { const n = { ...p }; delete n[id]; return n; });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Users</h1>
          <p className="mt-0.5 text-sm text-ink-500">{users.length} total</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-cloud pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30 w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cloud bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud bg-[#F8F9FA] text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Last Sign-in</th>
                <th className="px-4 py-3 text-left">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-[#FAFBFC]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{user.full_name ?? '—'}</p>
                    <p className="text-xs text-ink-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                      <RoleIcon role={user.role} />
                      {ROLE_OPTIONS.find((r) => r.value === user.role)?.label ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {changingId === user.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={user.role}
                          onChange={(e) =>
                            changeRole.mutate({
                              id: user.id,
                              role: e.target.value as UserRole,
                              reason: reasonMap[user.id],
                            })
                          }
                          className="rounded-lg border border-cloud px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Reason (optional)"
                          value={reasonMap[user.id] ?? ''}
                          onChange={(e) =>
                            setReasonMap((p) => ({ ...p, [user.id]: e.target.value }))
                          }
                          className="w-36 rounded-lg border border-cloud px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-navy/30"
                        />
                        <button
                          type="button"
                          onClick={() => setChangingId(null)}
                          className="text-xs text-ink-400 hover:text-ink-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setChangingId(user.id)}
                        className="rounded-lg border border-cloud px-3 py-1 text-xs font-medium text-ink-600 hover:border-navy hover:text-navy transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
