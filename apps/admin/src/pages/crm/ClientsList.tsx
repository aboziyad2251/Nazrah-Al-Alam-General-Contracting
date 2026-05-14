import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { exportToCSV } from '@/lib/exportUtils';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader, Btn, EmptyState } from '@/components/ui/index';
import { Building2, Search, Download } from 'lucide-react';

interface Client {
  id: number;
  vat_number: string;
  credit_limit: number;
  payment_terms_days: number;
  profile: { full_name: string; phone: string; company: string };
  lifetime_value: number;
}

export default function ClientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select(
          `
          id, vat_number, credit_limit, payment_terms_days,
          profile:profiles(full_name, phone, company)
        `
        )
        .order('id');
      if (!data) return [];
      // Get lifetime value (sum of paid invoices per client)
      const ids = data.map((c: any) => c.id);
      const { data: invoices } = await supabase
        .from('invoices')
        .select('client_id, total_sar')
        .in('client_id', ids)
        .eq('status', 'paid');
      const ltv: Record<number, number> = {};
      invoices?.forEach((inv: any) => {
        ltv[inv.client_id] = (ltv[inv.client_id] ?? 0) + Number(inv.total_sar);
      });
      return data.map((c: any) => ({ ...c, lifetime_value: ltv[c.id] ?? 0 })) as Client[];
    },
  });

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.profile?.full_name?.toLowerCase().includes(q) ||
      c.profile?.company?.toLowerCase().includes(q) ||
      c.profile?.phone?.includes(q)
    );
  });

  const columns: Column<Client>[] = [
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-medium text-ink-900">{c.profile?.company ?? '—'}</p>
          <p className="text-xs text-ink-500">{c.profile?.full_name}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (c) => c.profile?.phone ?? '—' },
    {
      key: 'credit_limit',
      header: 'Credit Limit',
      sortable: true,
      render: (c) => (c.credit_limit ? `SAR ${Number(c.credit_limit).toLocaleString()}` : '—'),
    },
    {
      key: 'payment_terms_days',
      header: 'Terms',
      render: (c) => (c.payment_terms_days ? `${c.payment_terms_days} days` : '—'),
    },
    {
      key: 'lifetime_value',
      header: 'Lifetime Value',
      sortable: true,
      render: (c) => (
        <span className="font-semibold text-green-600">
          SAR {c.lifetime_value.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${filtered.length} clients`}
        action={
          <Btn
            variant="secondary"
            size="sm"
            onClick={() =>
              exportToCSV(
                filtered.map((c) => ({
                  id: c.id,
                  company: c.profile?.company,
                  name: c.profile?.full_name,
                  phone: c.profile?.phone,
                  ltv: c.lifetime_value,
                })),
                'clients'
              )
            }
          >
            <Download size={14} /> Export
          </Btn>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, company, phone…"
          className="w-full rounded-lg border border-cloud py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyField="id"
        selectable
        loading={isLoading}
        rowClick={(c) => navigate(`/crm/clients/${c.id}`)}
        emptyState={<EmptyState icon={<Building2 size={40} />} title="No clients found" />}
        bulkActions={(rows) => (
          <Btn
            size="sm"
            variant="secondary"
            onClick={() =>
              exportToCSV(
                rows.map((c) => ({ id: c.id, company: c.profile?.company })),
                'clients-export'
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
