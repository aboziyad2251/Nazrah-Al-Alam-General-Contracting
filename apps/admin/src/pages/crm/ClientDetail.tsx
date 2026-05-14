import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader, Card, StatusBadge, Btn, Textarea, Skeleton } from '@/components/ui/index';
import { format } from 'date-fns';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { logAudit } from '@/lib/auditLog';

const TABS = ['Overview', 'Quotes', 'Bookings', 'Invoices', 'Notes'] as const;
type Tab = (typeof TABS)[number];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Overview');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client-detail', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select(`*, profile:profiles(*)`)
        .eq('id', id!)
        .single();
      return data;
    },
  });

  const { data: quotes = [] } = useQuery({
    queryKey: ['client-quotes', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('client_id', id!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['client-bookings', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', id!)
        .order('delivery_date', { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['client-invoices', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', id!)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!id,
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['client-notes', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_activities')
        .select('*, actor:profiles(full_name)')
        .order('created_at', { ascending: false });
      return (data ?? []).filter((_: any) => true); // notes without lead filtering for clients
    },
    enabled: !!id,
  });

  const ltv = invoices
    .filter((i: any) => i.status === 'paid')
    .reduce((s: number, i: any) => s + Number(i.total_sar), 0);

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from('lead_activities').insert({
      type: 'note',
      body: note,
      actor_id: user?.id,
      done: true,
    });
    await logAudit('note', 'client', id!, { note });
    toast.success('Note added');
    setNote('');
    setSaving(false);
    refetchNotes();
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  if (!client) return <p>Client not found</p>;

  return (
    <div>
      <button
        onClick={() => navigate('/crm/clients')}
        className="mb-4 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={14} /> Back to clients
      </button>

      {/* Header */}
      <Card className="mb-6 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink-900">
              {client.profile?.company ?? client.profile?.full_name}
            </h1>
            <p className="text-sm text-ink-500">{client.profile?.full_name}</p>
            <div className="mt-2 flex items-center gap-3 text-sm">
              {client.profile?.phone && (
                <span className="text-ink-700">{client.profile.phone}</span>
              )}
              {client.vat_number && <span className="text-ink-500">VAT: {client.vat_number}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500">Lifetime Value</p>
            <p className="text-2xl font-bold text-green-600">SAR {ltv.toLocaleString()}</p>
            <p className="mt-1 text-xs text-ink-500">
              Credit limit: SAR {Number(client.credit_limit ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-stone">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-navy text-navy'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-stone bg-white p-4 text-center">
            <p className="text-2xl font-bold text-ink-900">{quotes.length}</p>
            <p className="text-xs text-ink-500">Total Quotes</p>
          </div>
          <div className="rounded-xl border border-stone bg-white p-4 text-center">
            <p className="text-2xl font-bold text-ink-900">{bookings.length}</p>
            <p className="text-xs text-ink-500">Bookings</p>
          </div>
          <div className="rounded-xl border border-stone bg-white p-4 text-center">
            <p className="text-2xl font-bold text-ink-900">
              {invoices.filter((i: any) => i.status === 'paid').length}
            </p>
            <p className="text-xs text-ink-500">Paid Invoices</p>
          </div>
        </div>
      )}

      {tab === 'Quotes' && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone bg-[#f8f9fb] text-left">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q: any) => (
                <tr key={q.id} className="border-b border-stone/40">
                  <td className="px-4 py-3">{q.project_name}</td>
                  <td className="px-4 py-3">SAR {Number(q.total_sar ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {format(new Date(q.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'Bookings' && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone bg-[#f8f9fb] text-left">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Return</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} className="border-b border-stone/40">
                  <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                  <td className="px-4 py-3">
                    {b.delivery_date ? format(new Date(b.delivery_date), 'MMM d') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {b.return_date ? format(new Date(b.return_date), 'MMM d') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'Invoices' && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone bg-[#f8f9fb] text-left">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-stone/40">
                  <td className="px-4 py-3 font-mono text-xs">#{inv.id}</td>
                  <td className="px-4 py-3">SAR {Number(inv.total_sar).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-500">
                    {inv.due_date ? format(new Date(inv.due_date), 'MMM d') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'Notes' && (
        <div className="space-y-4">
          <Card className="p-4">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note…"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <Btn onClick={addNote} disabled={saving || !note.trim()} size="sm">
                <Send size={12} /> Add Note
              </Btn>
            </div>
          </Card>
          {notes.map((n: any) => (
            <Card key={n.id} className="p-4">
              <p className="text-ink-800 text-sm">{n.body}</p>
              <p className="mt-1 text-xs text-ink-500">
                {n.actor?.full_name ?? 'Admin'} ·{' '}
                {format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
