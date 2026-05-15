import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { PageHeader, Skeleton, StatusBadge, EmptyState } from '@/components/ui';
import { Receipt, Download, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { printInvoicePdf } from '@/lib/invoicePdf';

interface Invoice {
  id: number;
  amount_sar: number;
  vat_sar: number;
  total_sar: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  pdf_url: string | null;
  bookings: {
    delivery_date: string | null;
    return_date: string | null;
    quotes: { project_name: string } | null;
  } | null;
}

interface ClientDetail {
  vat_number: string | null;
  billing_address: string | null;
}

export default function InvoicesPage() {
  const { user, profile } = useAuthStore();
  const { locale } = useUIStore();

  const { data: clientRow } = useQuery({
    queryKey: ['client-row', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, vat_number, billing_address')
        .eq('profile_id', user!.id)
        .single();
      return data as (ClientDetail & { id: number }) | null;
    },
  });

  const clientId = clientRow?.id ?? null;

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, bookings(delivery_date, return_date, quotes(project_name))')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      return (data ?? []) as Invoice[];
    },
  });

  const handleDownload = (inv: Invoice) => {
    printInvoicePdf(
      {
        id: inv.id,
        amount_sar: Number(inv.amount_sar),
        vat_sar: Number(inv.vat_sar),
        total_sar: Number(inv.total_sar),
        status: inv.status,
        due_date: inv.due_date,
        paid_at: inv.paid_at,
        created_at: inv.created_at,
        projectName: inv.bookings?.quotes?.project_name,
        deliveryDate: inv.bookings?.delivery_date,
        returnDate: inv.bookings?.return_date,
      },
      {
        company: profile?.company ?? null,
        full_name: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
        vat_number: clientRow?.vat_number ?? null,
        billing_address: clientRow?.billing_address ?? null,
      }
    );
  };

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
          title={locale === 'ar' ? 'لا توجد فواتير بعد' : 'No invoices yet'}
          subtitle={
            locale === 'ar'
              ? 'ستظهر الفواتير هنا بعد تأكيد الحجوزات.'
              : 'Invoices will appear here once bookings are confirmed.'
          }
          icon={<Receipt size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const projectName = inv.bookings?.quotes?.project_name;
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
                      {locale === 'ar' ? 'تاريخ الاستحقاق:' : 'Due:'}{' '}
                      {inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '—'}
                      {inv.paid_at &&
                        ` · ${locale === 'ar' ? 'مدفوع:' : 'Paid:'} ${format(new Date(inv.paid_at), 'dd MMM yyyy')}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-[#0E1F3A]">
                      SAR {Number(inv.total_sar).toLocaleString()}
                    </p>
                    <p className="text-xs text-[#5A6573]">
                      {locale === 'ar' ? 'شامل ضريبة القيمة المضافة' : 'incl. VAT'} SAR{' '}
                      {Number(inv.vat_sar).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 border-t border-[#E8EAED] pt-4">
                  {/* Always show PDF download (generated client-side); prefer stored url if exists */}
                  {inv.pdf_url ? (
                    <a
                      href={inv.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-[#E8EAED] px-4 py-2 text-sm font-medium text-[#5A6573] transition-colors hover:bg-[#D9DCE0]"
                    >
                      <Download size={14} />
                      {locale === 'ar' ? 'تنزيل PDF' : 'Download PDF'}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownload(inv)}
                      className="flex items-center gap-1.5 rounded-xl border border-[#E8EAED] px-4 py-2 text-sm font-medium text-[#5A6573] transition-colors hover:bg-[#D9DCE0]"
                    >
                      <FileDown size={14} />
                      {locale === 'ar' ? 'طباعة / PDF' : 'Print / PDF'}
                    </button>
                  )}

                  {inv.status === 'issued' && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-xl bg-[#0E1F3A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1628]"
                    >
                      {locale === 'ar' ? 'ادفع الآن' : 'Pay Now'} (Mada / STC)
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
