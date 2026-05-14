import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { exportToCSV, exportToExcel } from '@/lib/exportUtils';
import { PageHeader, Card, KpiCard, Skeleton } from '@/components/ui/index';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts';
import { Download, TrendingUp, Truck, DollarSign, Users } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const PALETTE = ['#0E1F3A', '#E8B339', '#3b82f6', '#22c55e', '#f97316'];

export default function AnalyticsDashboard() {
  const [from, setFrom] = useState(format(subMonths(new Date(), 5), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: revenueData = [], isLoading: revLoading } = useQuery({
    queryKey: ['analytics-revenue', from, to],
    queryFn: async () => {
      const { data } = await supabase.from('v_revenue_by_month').select('*').order('month');
      return (data ?? []).map((r: any) => ({
        month: format(new Date(r.month), 'MMM yy'),
        revenue: Number(r.total_revenue ?? 0),
        count: Number(r.invoice_count ?? 0),
      }));
    },
  });

  const { data: utilizationData = [] } = useQuery({
    queryKey: ['analytics-utilization'],
    queryFn: async () => {
      const { data } = await supabase
        .from('v_equipment_utilization')
        .select('*')
        .order('utilization_pct', { ascending: false })
        .limit(10);
      return (data ?? []).map((r: any) => ({
        name: r.model_name,
        days: Number(r.days_rented ?? 0),
        pct: Number(r.utilization_pct ?? 0).toFixed(1),
      }));
    },
  });

  const { data: topClients = [] } = useQuery({
    queryKey: ['analytics-top-clients'],
    queryFn: async () => {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('client_id, total_sar, clients(profile:profiles(company, full_name))')
        .eq('status', 'paid');
      if (!invoices) return [];
      const map: Record<number, { name: string; revenue: number }> = {};
      invoices.forEach((inv: any) => {
        const cid = inv.client_id;
        const name = inv.clients?.profile?.company ?? inv.clients?.profile?.full_name ?? 'Unknown';
        if (!map[cid]) map[cid] = { name, revenue: 0 };
        map[cid].revenue += Number(inv.total_sar);
      });
      return Object.values(map)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    },
  });

  const { data: pipeline } = useQuery({
    queryKey: ['analytics-pipeline'],
    queryFn: async () => {
      const { data } = await supabase.from('v_quote_pipeline').select('*');
      return data ?? [];
    },
  });

  const totalRevenue = revenueData.reduce((s: number, r: any) => s + r.revenue, 0);
  const avgUtilization = utilizationData.length
    ? (
        utilizationData.reduce((s: number, r: any) => s + Number(r.pct), 0) / utilizationData.length
      ).toFixed(1)
    : 0;

  const funnelData = [
    {
      name: 'Quotes Created',
      value:
        pipeline?.find((p: any) => p.status === 'draft')?.quote_count ??
        0 + (pipeline?.find((p: any) => p.status === 'sent')?.quote_count ?? 0),
      fill: '#0E1F3A',
    },
    {
      name: 'Quotes Accepted',
      value: pipeline?.find((p: any) => p.status === 'accepted')?.quote_count ?? 0,
      fill: '#162d55',
    },
    { name: 'Booked', value: 0, fill: '#E8B339' },
    { name: 'Invoiced', value: 0, fill: '#22c55e' },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => exportToCSV(revenueData, 'revenue')}
              className="text-ink-700 flex items-center gap-1.5 rounded-lg bg-stone px-3 py-1.5 text-xs font-medium hover:bg-cloud"
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={() => exportToExcel(revenueData, 'nazrah-analytics')}
              className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
            >
              <Download size={12} /> Excel
            </button>
          </div>
        }
      />

      {/* Date range filter */}
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-stone bg-white px-4 py-3">
        <span className="text-sm font-medium text-ink-500">Date range:</span>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-cloud px-2 py-1 text-sm focus:outline-none"
        />
        <span className="text-ink-400">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-cloud px-2 py-1 text-sm focus:outline-none"
        />
      </div>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={`SAR ${(totalRevenue / 1000).toFixed(0)}k`}
          icon={<DollarSign size={18} />}
          color="navy"
        />
        <KpiCard
          label="Avg Fleet Utilization"
          value={`${avgUtilization}%`}
          icon={<Truck size={18} />}
          color="gold"
        />
        <KpiCard
          label="Top Client Revenue"
          value={topClients[0] ? `SAR ${(topClients[0].revenue / 1000).toFixed(0)}k` : '—'}
          icon={<Users size={18} />}
          color="green"
        />
        <KpiCard
          label="Revenue Invoices"
          value={revenueData.reduce((s: number, r: any) => s + r.count, 0)}
          icon={<TrendingUp size={18} />}
          color="navy"
        />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="col-span-2 p-5">
          <p className="mb-4 font-semibold text-ink-900">Revenue by Month</p>
          {revLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`SAR ${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#0E1F3A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top clients */}
        <Card className="p-5">
          <p className="mb-4 font-semibold text-ink-900">Top Clients</p>
          <div className="space-y-3">
            {topClients.map((client: any, i: number) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: PALETTE[i] }}
                  >
                    {i + 1}
                  </div>
                  <span className="truncate text-sm font-medium text-ink-900">{client.name}</span>
                </div>
                <span className="flex-shrink-0 text-sm font-semibold text-green-600">
                  SAR {(client.revenue / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Utilization */}
        <Card className="p-5">
          <p className="mb-4 font-semibold text-ink-900">Equipment Utilization</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={utilizationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Utilization']} />
              <Bar dataKey="pct" fill="#E8B339" radius={[0, 4, 4, 0]}>
                {utilizationData.map((_: any, i: number) => (
                  <Cell
                    key={i}
                    fill={
                      Number(_.pct) > 70 ? '#22c55e' : Number(_.pct) > 40 ? '#E8B339' : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Conversion funnel */}
        <Card className="p-5">
          <p className="mb-4 font-semibold text-ink-900">Quote → Invoice Funnel</p>
          <ResponsiveContainer width="100%" height={220}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList position="inside" fill="#fff" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
