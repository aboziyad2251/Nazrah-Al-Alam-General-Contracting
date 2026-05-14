import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditRow {
  id: number;
  target_user_id: string;
  changed_by: string | null;
  old_role: string | null;
  new_role: string;
  reason: string | null;
  created_at: string;
  target_email?: string;
  changer_email?: string;
}

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<AuditRow[]>({
    queryKey: ['role-audit', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_audit')
        .select(`
          id,
          target_user_id,
          changed_by,
          old_role,
          new_role,
          reason,
          created_at
        `)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      return data as AuditRow[];
    },
  });

  const rows = data ?? [];
  const hasNext = rows.length === PAGE_SIZE;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-900">Role Audit Log</h1>
        <p className="mt-0.5 text-sm text-ink-500">Every role change, immutable record.</p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-cloud bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cloud bg-[#F8F9FA] text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 text-left">When</th>
                  <th className="px-4 py-3 text-left">Target User</th>
                  <th className="px-4 py-3 text-left">Changed By</th>
                  <th className="px-4 py-3 text-left">Old Role</th>
                  <th className="px-4 py-3 text-left">New Role</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cloud">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-600">
                      {row.target_user_id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-600">
                      {row.changed_by ? `${row.changed_by.slice(0, 8)}…` : <span className="text-ink-300">system</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.old_role ? (
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                          {row.old_role}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {row.new_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-500 max-w-[200px] truncate">
                      {row.reason ?? <span className="text-ink-300">—</span>}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-400">
                      No audit entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 rounded-lg border border-cloud px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-navy disabled:opacity-40"
            >
              <ChevronLeft size={12} /> Prev
            </button>
            <span className="text-xs text-ink-400">Page {page + 1}</span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
              className="flex items-center gap-1 rounded-lg border border-cloud px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-navy disabled:opacity-40"
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
