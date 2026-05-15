import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { PageHeader, StatusBadge, Btn } from '@/components/ui/index';
import { Receipt, Plus, CheckCircle, CreditCard, Download, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

const VAT_RATE = 0.15;
const STATUS_OPTS = ['', 'draft', 'issued', 'paid', 'overdue', 'cancelled'];

interface Invoice {
  id: number;
  booking_id: number;
  client_id: number;
  amount_sar: number;
  vat_sar: number;
  total_sar: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  created_at: string;
  bookings: {
    quotes: { project_name: string | null } | null;
  } | null;
  clients: {
    profile: { full_name: string | null; company: string | null } | null;
  } | null;
}

interface UninvoicedBooking {
  id: number;
  client_id: number;
  status: string;
  quotes: { project_name: string | null; total_sar: number } | null;
  clients: { profile: { full_name: string | null; company: string | null } | null } | null;
}

export default function InvoicesListPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['admin-invoices', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('invoices')
        .select(
          '*, bookings(quotes(project_name)), clients(profile:profiles(full_name, company))'
        )
        .order('created_at', { ascending: false });
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      paid_at,
    }: {
      id: number;
      status: string;
      paid_at?: string;
    }) => {
      const patch: Record<string, unknown> = { status };
      if (paid_at) patch.paid_at = paid_at;
      const { error } = await supabase.from('invoices').update(patch).eq('id', id);
      if (error) throw error;
      await logAudit('update', 'invoice', id, { status });
    },
    onSuccess: (_, { status }) => {
      toast.success(`Invoice ${status}`);
      qc.invalidateQueries({ queryKey: ['admin-invoices'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalOutstanding = invoices
    .filter((i) => i.status === 'issued' || i.status === 'overdue')
    .reduce((s, i) => s + Number(i.total_sar), 0);

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total_sar), 0);

  return (
    <div className="p-6">
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} total · SAR ${totalOutstanding.toLocaleString()} outstanding`}
        action={
          <Btn onClick={() => setNewOpen(true)} icon={<Plus size={15} />}>
            New Invoice
          </Btn>
        }
      />

      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Draft',       count: invoices.filter((i) => i.status === 'draft').length,     color: 'text-ink-500' },
          { label: 'Issued',      count: invoices.filter((i) => i.status === 'issued').length,    color: 'text-blue-600' },
          { label: 'Overdue',     count: invoices.filter((i) => i.status === 'overdue').length,   color: 'text-red-600' },
          { label: 'Paid',        count: invoices.filter((i) => i.status === 'paid').length,      color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-cloud bg-white px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="mt-0.5 text-xs font-medium text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {STATUS_OPTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'border-navy bg-navy text-white'
                : 'border-cloud bg-white text-ink-600 hover:border-navy/40'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-cloud bg-white py-20 text-center">
          <Receipt size={32} className="mb-3 text-ink-300" />
          <p className="font-semibold text-ink-900">No invoices yet</p>
          <p className="mt-1 text-sm text-ink-500">Create your first invoice from an accepted booking.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cloud bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud bg-[#F8F9FA] text-xs font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">VAT</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Due</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud">
              {invoices.map((inv) => {
                const client = inv.clients?.profile;
                const project = inv.bookings?.quotes?.project_name;
                return (
                  <tr key={inv.id} className="hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3 font-mono text-xs text-ink-400">#{inv.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{client?.full_name ?? '—'}</p>
                      {client?.company && (
                        <p className="text-xs text-ink-400">{client.company}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{project ?? `Booking #${inv.booking_id}`}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900">
                      {Number(inv.amount_sar).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-500">
                      {Number(inv.vat_sar).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy">
                      SAR {Number(inv.total_sar).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {inv.paid_at
                        ? `Paid ${format(new Date(inv.paid_at), 'dd MMM')}`
                        : inv.due_date
                        ? format(new Date(inv.due_date), 'dd MMM yyyy')
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {inv.status === 'draft' && (
                          <ActionBtn
                            icon={<CheckCircle size={13} />}
                            label="Issue"
                            color="blue"
                            onClick={() => updateStatus.mutate({ id: inv.id, status: 'issued' })}
                          />
                        )}
                        {(inv.status === 'issued' || inv.status === 'overdue') && (
                          <ActionBtn
                            icon={<CreditCard size={13} />}
                            label="Mark Paid"
                            color="green"
                            onClick={() =>
                              updateStatus.mutate({
                                id: inv.id,
                                status: 'paid',
                                paid_at: new Date().toISOString(),
                              })
                            }
                          />
                        )}
                        {inv.pdf_url && (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-cloud px-2 py-1 text-xs text-ink-500 hover:border-navy/40 hover:text-navy transition-colors"
                          >
                            <Download size={12} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {newOpen && <CreateInvoiceModal onClose={() => setNewOpen(false)} />}
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: 'blue' | 'green';
  onClick: () => void;
}) {
  const cls =
    color === 'blue'
      ? 'border-blue-200 text-blue-600 hover:bg-blue-50'
      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${cls}`}
    >
      {icon} {label}
    </button>
  );
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [bookingId, setBookingId] = useState<number | ''>('');
  const [amountSar, setAmountSar] = useState('');
  const [dueDays, setDueDays] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  const vatSar = amountSar ? Math.round(Number(amountSar) * VAT_RATE * 100) / 100 : 0;
  const totalSar = amountSar ? Number(amountSar) + vatSar : 0;

  const { data: bookings = [] } = useQuery<UninvoicedBooking[]>({
    queryKey: ['uninvoiced-bookings'],
    queryFn: async () => {
      const [bookingsRes, invoicesRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, client_id, status, quotes(project_name, total_sar), clients(profile:profiles(full_name, company))')
          .in('status', ['confirmed', 'in_progress', 'completed']),
        supabase.from('invoices').select('booking_id'),
      ]);
      const invoicedIds = new Set((invoicesRes.data ?? []).map((i) => i.booking_id));
      return ((bookingsRes.data ?? []) as UninvoicedBooking[]).filter(
        (b) => !invoicedIds.has(b.id)
      );
    },
  });

  const selectedBooking = bookings.find((b) => b.id === bookingId);

  const handleBookingChange = (id: number) => {
    setBookingId(id);
    const booking = bookings.find((b) => b.id === id);
    if (booking?.quotes?.total_sar) {
      const pretax = Math.round((booking.quotes.total_sar / (1 + VAT_RATE)) * 100) / 100;
      setAmountSar(String(pretax));
    }
  };

  const submit = async () => {
    if (!bookingId || !amountSar) {
      toast.error('Select a booking and enter amount');
      return;
    }
    if (!selectedBooking) return;
    setSubmitting(true);
    const dueDate = format(addDays(new Date(), Number(dueDays) || 30), 'yyyy-MM-dd');
    const { error } = await supabase.from('invoices').insert({
      booking_id: bookingId,
      client_id: selectedBooking.client_id,
      amount_sar: Number(amountSar),
      vat_sar: vatSar,
      total_sar: totalSar,
      status: 'draft',
      due_date: dueDate,
    });
    if (error) {
      toast.error(error.message);
    } else {
      await logAudit('create', 'invoice', null, { booking_id: bookingId, total: totalSar });
      toast.success('Invoice created');
      qc.invalidateQueries({ queryKey: ['admin-invoices'] });
      onClose();
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-cloud px-6 py-4">
          <h2 className="font-semibold text-ink-900">New Invoice</h2>
          <button type="button" onClick={onClose} className="text-ink-400 hover:text-ink-900">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          {/* Booking picker */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">
              Booking <span className="text-red-500">*</span>
            </label>
            {bookings.length === 0 ? (
              <p className="rounded-xl border border-cloud bg-[#F8F9FA] p-3 text-sm text-ink-500">
                No accepted bookings without an invoice.
              </p>
            ) : (
              <select
                title="Select booking"
                value={bookingId}
                onChange={(e) => handleBookingChange(Number(e.target.value))}
                className="w-full rounded-xl border border-cloud px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
              >
                <option value="">Select booking…</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    #{b.id} — {b.quotes?.project_name ?? 'Unnamed'} (
                    {b.clients?.profile?.full_name ?? 'Unknown'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">
              Amount before VAT (SAR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              title="Amount before VAT"
              placeholder="0.00"
              value={amountSar}
              onChange={(e) => setAmountSar(e.target.value)}
              className="w-full rounded-xl border border-cloud px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {/* VAT summary */}
          {amountSar && (
            <div className="rounded-xl bg-[#F8F9FA] p-3 text-sm">
              <div className="flex justify-between text-ink-500">
                <span>VAT (15%)</span>
                <span>SAR {vatSar.toLocaleString()}</span>
              </div>
              <div className="mt-1 flex justify-between font-bold text-ink-900">
                <span>Total</span>
                <span>SAR {totalSar.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Due days */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">
              Payment terms (days)
            </label>
            <select
              title="Payment terms"
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              className="w-full rounded-xl border border-cloud px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              {['7', '14', '30', '45', '60'].map((d) => (
                <option key={d} value={d}>
                  Net {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 border-t border-cloud px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-cloud py-2.5 text-sm font-medium text-ink-600 hover:bg-[#F8F9FA]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !bookingId || !amountSar}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
