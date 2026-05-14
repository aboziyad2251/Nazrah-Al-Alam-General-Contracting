import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import {
  PageHeader,
  Card,
  Btn,
  Modal,
  FormField,
  Input,
  Textarea,
  EmptyState,
} from '@/components/ui/index';
import { Wrench, AlertTriangle, CheckCircle2, Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/cn';

const TABS = ['Alerts', 'History', 'Vendors'] as const;
type Tab = (typeof TABS)[number];

function alertLevel(nextAt: string | null): 'overdue' | 'due_soon' | 'ok' {
  if (!nextAt) return 'ok';
  const days = differenceInDays(new Date(nextAt), new Date());
  if (days < 0) return 'overdue';
  if (days <= 7) return 'due_soon';
  return 'ok';
}

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('Alerts');
  const [vendorModal, setVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    specialization: '',
  });
  const [savingV, setSavingV] = useState(false);

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['service-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_service_due')
        .select('*, equipment:equipment(model_name, brand), vendor:vendors(name)')
        .order('next_service_at');
      return data ?? [];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ['maint-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_logs')
        .select('*, equipment:equipment(model_name)')
        .order('performed_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data } = await supabase.from('vendors').select('*').order('name');
      return data ?? [];
    },
  });

  const markComplete = async (alert: any) => {
    const payload = {
      equipment_id: alert.equipment_id,
      type: alert.service_type,
      description: `Scheduled service: ${alert.service_type}`,
      performed_at: new Date().toISOString(),
      cost_sar: alert.estimated_cost_sar,
    };
    const { data: log } = await supabase
      .from('maintenance_logs')
      .insert(payload)
      .select('id')
      .single();
    if (log)
      await logAudit('complete_service', 'maintenance_service_due', alert.id, { log_id: log.id });
    // Update last_service_at
    await supabase
      .from('maintenance_service_due')
      .update({ last_service_at: new Date().toISOString() })
      .eq('id', alert.id);
    toast.success('Service marked complete');
    qc.invalidateQueries({ queryKey: ['service-alerts'] });
    qc.invalidateQueries({ queryKey: ['maint-history'] });
  };

  const saveVendor = async () => {
    if (!vendorForm.name) {
      toast.error('Vendor name required');
      return;
    }
    setSavingV(true);
    const { data } = await supabase.from('vendors').insert(vendorForm).select('id').single();
    if (data) await logAudit('create', 'vendor', data.id, vendorForm);
    toast.success('Vendor added');
    setSavingV(false);
    setVendorModal(false);
    setVendorForm({ name: '', contact_name: '', phone: '', email: '', specialization: '' });
    qc.invalidateQueries({ queryKey: ['vendors'] });
  };

  const overdueCount = alerts.filter(
    (a: any) => alertLevel(a.next_service_at) === 'overdue'
  ).length;
  const dueSoonCount = alerts.filter(
    (a: any) => alertLevel(a.next_service_at) === 'due_soon'
  ).length;

  return (
    <div>
      <PageHeader title="Maintenance Tracker" />

      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="mb-4 flex gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle size={14} /> {overdueCount} overdue service(s)
            </div>
          )}
          {dueSoonCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
              <AlertTriangle size={14} /> {dueSoonCount} due within 7 days
            </div>
          )}
        </div>
      )}

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
            {t === 'Alerts' && overdueCount + dueSoonCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                {overdueCount + dueSoonCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Alerts' && (
        <div className="space-y-3">
          {alertsLoading ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={40} className="text-green-500" />}
              title="All services up to date!"
            />
          ) : (
            alerts.map((a: any) => {
              const level = alertLevel(a.next_service_at);
              return (
                <Card
                  key={a.id}
                  className={cn(
                    'flex items-center justify-between gap-4 p-4',
                    level === 'overdue'
                      ? 'border-red-200 bg-red-50'
                      : level === 'due_soon'
                        ? 'border-yellow-200 bg-yellow-50'
                        : ''
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-2 w-2 flex-shrink-0 rounded-full',
                        level === 'overdue'
                          ? 'bg-red-500'
                          : level === 'due_soon'
                            ? 'bg-yellow-400'
                            : 'bg-green-400'
                      )}
                    />
                    <div>
                      <p className="font-medium text-ink-900">
                        {a.equipment?.model_name} — {a.service_type}
                      </p>
                      <p className="text-xs text-ink-500">
                        {a.next_service_at
                          ? format(new Date(a.next_service_at), 'MMM d, yyyy')
                          : 'No date set'}
                        {a.vendor?.name && ` · ${a.vendor.name}`}
                        {a.estimated_cost_sar &&
                          ` · SAR ${Number(a.estimated_cost_sar).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <Btn size="sm" variant="secondary" onClick={() => markComplete(a)}>
                    <CheckCircle2 size={12} /> Mark Done
                  </Btn>
                </Card>
              );
            })
          )}
        </div>
      )}

      {tab === 'History' && (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone bg-[#f8f9fb] text-left">
                <th className="px-4 py-3">Equipment</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id} className="border-b border-stone/40">
                  <td className="px-4 py-3">{h.equipment?.model_name}</td>
                  <td className="px-4 py-3 capitalize">{h.type?.replace('_', ' ')}</td>
                  <td className="text-ink-600 max-w-xs truncate px-4 py-3">{h.description}</td>
                  <td className="px-4 py-3">
                    {h.cost_sar ? `SAR ${Number(h.cost_sar).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {format(new Date(h.performed_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'Vendors' && (
        <div>
          <div className="mb-3 flex justify-end">
            <Btn onClick={() => setVendorModal(true)}>
              <Plus size={14} /> Add Vendor
            </Btn>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {vendors.map((v: any) => (
              <Card key={v.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy/10">
                    <Building2 size={16} className="text-navy" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{v.name}</p>
                    {v.specialization && <p className="text-xs text-ink-500">{v.specialization}</p>}
                    {v.contact_name && (
                      <p className="text-ink-600 mt-1 text-xs">{v.contact_name}</p>
                    )}
                    {v.phone && <p className="text-xs text-ink-500">{v.phone}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={vendorModal} onClose={() => setVendorModal(false)} title="Add Vendor">
        <div className="space-y-3">
          <FormField label="Company Name *">
            <Input
              value={vendorForm.name}
              onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Al-Hajji Services"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Name">
              <Input
                value={vendorForm.contact_name}
                onChange={(e) => setVendorForm((f) => ({ ...f, contact_name: e.target.value }))}
              />
            </FormField>
            <FormField label="Phone">
              <Input
                value={vendorForm.phone}
                onChange={(e) => setVendorForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Specialization">
            <Input
              value={vendorForm.specialization}
              onChange={(e) => setVendorForm((f) => ({ ...f, specialization: e.target.value }))}
              placeholder="Engine repair, hydraulics…"
            />
          </FormField>
          <div className="flex gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setVendorModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={saveVendor} disabled={savingV} className="flex-1">
              {savingV ? 'Saving…' : 'Add Vendor'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
