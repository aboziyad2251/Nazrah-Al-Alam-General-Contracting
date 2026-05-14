import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { KpiCard, Card, Skeleton } from '@/components/ui/index';
import { PageHeader } from '@/components/ui/index';
import { Truck, FileText, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export default function OverviewPage() {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['admin-kpis'],
    queryFn: async () => {
      const [fleetRes, quotesRes, revenueRes, clientsRes] = await Promise.all([
        supabase.from('equipment').select('status', { count: 'exact', head: false }),
        supabase.from('quotes').select('status').in('status', ['draft', 'sent']),
        supabase
          .from('v_revenue_by_month')
          .select('*')
          .order('month', { ascending: false })
          .limit(6),
        supabase.from('clients').select('id', { count: 'exact', head: true }),
      ]);
      return {
        fleet: fleetRes.data ?? [],
        quotes: quotesRes.data?.length ?? 0,
        revenue: revenueRes.data ?? [],
        clients: clientsRes.count ?? 0,
      };
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_service_due')
        .select('*, equipment(model_name)')
        .lte('next_service_at', new Date(Date.now() + 7 * 86400000).toISOString())
        .order('next_service_at')
        .limit(5);
      return data ?? [];
    },
  });

  const rented = kpis?.fleet.filter((e: any) => e.status === 'rented').length ?? 0;
  const available = kpis?.fleet.filter((e: any) => e.status === 'available').length ?? 0;
  const totalRevenue =
    kpis?.revenue.reduce((s: number, r: any) => s + Number(r.total_revenue ?? 0), 0) ?? 0;

  const chartData = [...(kpis?.revenue ?? [])].reverse().map((r: any) => ({
    month: format(new Date(r.month), 'MMM'),
    revenue: Number(r.total_revenue ?? 0),
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Good morning — ${format(new Date(), 'EEEE, MMMM d')}`}
      />

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <KpiCard
              label="Machines Rented"
              value={rented}
              icon={<Truck size={18} />}
              color="navy"
            />
            <KpiCard
              label="Available Fleet"
              value={available}
              icon={<Truck size={18} />}
              color="green"
            />
            <KpiCard
              label="Open Quotes"
              value={kpis?.quotes ?? 0}
              icon={<FileText size={18} />}
              color="gold"
            />
            <KpiCard
              label="Total Clients"
              value={kpis?.clients ?? 0}
              icon={<Users size={18} />}
              color="navy"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-ink-900">Revenue (last 6 months)</p>
            <p className="text-sm font-bold text-navy">SAR {totalRevenue.toLocaleString()}</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`SAR ${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#0E1F3A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Alerts */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            <p className="font-semibold text-ink-900">Service Alerts</p>
          </div>
          {alerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">No upcoming service due</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a: any) => (
                <li key={a.id} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                  <div>
                    <p className="text-sm font-medium text-ink-900">{a.equipment?.model_name}</p>
                    <p className="text-xs text-ink-500">
                      {a.service_type} ·{' '}
                      {a.next_service_at ? format(new Date(a.next_service_at), 'MMM d') : 'Soon'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
