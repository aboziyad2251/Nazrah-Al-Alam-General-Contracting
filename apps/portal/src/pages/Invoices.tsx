import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { PageHeader, Skeleton, StatusBadge, EmptyState } from '@/components/ui';
import { Receipt, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const { locale } = useUIStore();

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

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*,bookings(quotes(project_name))')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title={locale === 'ar' ? 'الفواتير' : 'Invoices'}
        subtitle={locale === 'ar' ? 'فواتيرك وسجلات الدفع.' : 'Your invoices and payment records.'}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !invoices?.length ? (
        <EmptyState
          title="No invoices yet"
          subtitle="Invoices will appear here once bookings are confirmed."
          icon={<Receipt size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const projectName = (inv.bookings as { quotes: { project_name: string } } | null)
              ?.quotes?.project_name;
            return (
              <div key={inv.id} className="rounded-2xl border border-[#E8EAED] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-3">
                      <p className="font-semibold text-[#0F1117]">Invoice #{inv.id}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                    {projectName && <p className="text-sm text-[#5A6573]">{projectName}</p>}
                    <p className="mt-1 text-xs text-[#5A6573]">
                      Due: {inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '—'}
                      {inv.paid_at && ` · Paid: ${format(new Date(inv.paid_at), 'dd MMM yyyy')}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-[#0E1F3A]">
                      SAR {Number(inv.total_sar).toLocaleString()}
                    </p>
                    <p className="text-xs text-[#5A6573]">
                      incl. VAT SAR {Number(inv.vat_sar).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-[#E8EAED] pt-4">
                  {inv.pdf_url && (
                    <a
                      href={inv.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-[#E8EAED] px-4 py-2 text-sm font-medium text-[#5A6573] transition-colors hover:bg-[#D9DCE0]"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                  {inv.status === 'issued' && (
                    <button className="flex items-center gap-1.5 rounded-xl bg-[#0E1F3A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1628]">
                      Pay Now (Mada / STC)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
