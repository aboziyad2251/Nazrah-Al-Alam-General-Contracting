import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { PageHeader, Skeleton, StatusBadge, EmptyState } from '@/components/ui';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

export default function QuotesPage() {
  const { user } = useAuthStore();
  const { locale } = useUIStore();
  const qc = useQueryClient();

  const { data: clientId } = useQuery({
    queryKey: ['client-id', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user!.id)
        .single();
      return data?.id as number | null;
    },
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from('quotes').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(`Quote ${status}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title={locale === 'ar' ? 'عروض الأسعار' : 'Quotes'}
        subtitle={
          locale === 'ar' ? 'تتبع وإدارة عروض أسعارك.' : 'Track and manage your quote requests.'
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !quotes?.length ? (
        <EmptyState
          title="No quotes yet"
          subtitle="Use the Quote Builder to request equipment pricing."
          icon={<FileText size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => (
            <div key={q.id} className="rounded-2xl border border-[#E8EAED] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-3">
                    <p className="font-semibold text-[#0F1117]">
                      {q.project_name || `Quote #${q.id}`}
                    </p>
                    <StatusBadge status={q.status} />
                  </div>
                  <p className="text-sm text-[#5A6573]">{q.project_location || '—'}</p>
                  <p className="mt-1 text-xs text-[#5A6573]">
                    {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-[#0E1F3A]">
                    SAR {Number(q.total_sar).toLocaleString()}
                  </p>
                  {q.start_date && (
                    <p className="mt-1 text-xs text-[#5A6573]">
                      {q.start_date} → {q.end_date}
                    </p>
                  )}
                </div>
              </div>
              {q.status === 'sent' && (
                <div className="mt-4 flex gap-2 border-t border-[#E8EAED] pt-4">
                  <button
                    onClick={() => updateStatus.mutate({ id: q.id, status: 'accepted' })}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <CheckCircle size={14} /> Accept
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: q.id, status: 'rejected' })}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
