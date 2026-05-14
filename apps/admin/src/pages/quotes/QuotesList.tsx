import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { exportToCSV } from '@/lib/exportUtils';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader, StatusBadge, Btn, EmptyState } from '@/components/ui/index';
import { FileText, Plus, Download, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Quote {
  id: number;
  status: string;
  project_name: string;
  total_sar: number;
  created_at: string;
  client: { profile: { full_name: string; company: string } };
}

const STATUS_OPTS = ['', 'draft', 'sent', 'accepted', 'rejected', 'expired'];

export default function QuotesListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-quotes', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('quotes')
        .select('*, client:clients(profile:profiles(full_name, company))')
        .order('created_at', { ascending: false });
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data } = await q;
      return (data ?? []) as Quote[];
    },
  });

  const sendQuote = async (quote: Quote) => {
    await supabase.from('quotes').update({ status: 'sent' }).eq('id', quote.id);
    await logAudit('send', 'quote', quote.id, { status: 'sent' });
    toast.success(`Quote #${quote.id} marked as sent`);
    qc.invalidateQueries({ queryKey: ['admin-quotes'] });
  };

  const columns: Column<Quote>[] = [
    {
      key: 'id',
      header: '#',
      sortable: true,
      width: 'w-16',
      render: (q) => <span className="font-mono text-xs text-ink-500">#{q.id}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      render: (q) => (
        <div>
          <p className="font-medium">
            {q.client?.profile?.company ?? q.client?.profile?.full_name}
          </p>
        </div>
      ),
    },
    { key: 'project_name', header: 'Project', render: (q) => q.project_name },
    {
      key: 'total_sar',
      header: 'Total',
      sortable: true,
      render: (q) => (
        <span className="font-semibold">SAR {Number(q.total_sar ?? 0).toLocaleString()}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (q) => <StatusBadge status={q.status} /> },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      render: (q) => format(new Date(q.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: '',
      render: (q) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Btn size="sm" variant="ghost" onClick={() => navigate(`/quotes/${q.id}`)}>
            <Eye size={12} /> Edit
          </Btn>
          {q.status === 'draft' && (
            <Btn size="sm" variant="ghost" onClick={() => sendQuote(q)}>
              <Send size={12} /> Send
            </Btn>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotes & Contracts"
        subtitle={`${data.length} quotes`}
        action={
          <div className="flex gap-2">
            <Btn
              variant="secondary"
              size="sm"
              onClick={() =>
                exportToCSV(
                  data.map((q) => ({
                    id: q.id,
                    project: q.project_name,
                    total: q.total_sar,
                    status: q.status,
                  })),
                  'quotes'
                )
              }
            >
              <Download size={14} /> Export
            </Btn>
            <Btn onClick={() => navigate('/quotes/new')}>
              <Plus size={14} /> New Quote
            </Btn>
          </div>
        }
      />

      <div className="mb-4 flex gap-3">
        {STATUS_OPTS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-navy text-white' : 'text-ink-600 bg-stone hover:bg-cloud'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyField="id"
        selectable
        loading={isLoading}
        rowClick={(q) => navigate(`/quotes/${q.id}`)}
        emptyState={<EmptyState icon={<FileText size={40} />} title="No quotes found" />}
        bulkActions={(rows) => (
          <Btn
            size="sm"
            variant="secondary"
            onClick={() =>
              exportToCSV(
                rows.map((q) => ({
                  id: q.id,
                  project: q.project_name,
                  total: q.total_sar,
                  status: q.status,
                })),
                'quotes-export'
              )
            }
          >
            <Download size={12} /> Export
          </Btn>
        )}
      />
    </div>
  );
}
