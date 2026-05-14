import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader, Modal, Btn, FormField, Input, EmptyState } from '@/components/ui/index';
import { HardHat, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/cn';

interface Operator {
  id: number;
  available: boolean;
  license_type: string;
  hourly_rate: number;
  certifications: Record<string, string>;
  profile: { full_name: string; phone: string };
}

function certStatus(expiryDate: string): 'expired' | 'expiring' | 'ok' {
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return 'expired';
  if (days < 30) return 'expiring';
  return 'ok';
}

export default function OperatorRosterPage() {
  const qc = useQueryClient();
  const [editOp, setEditOp] = useState<Operator | null>(null);
  const [form, setForm] = useState<any>({});
  const [certEntries, setCerts] = useState<{ name: string; expiry: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: operators = [], isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const { data } = await supabase
        .from('operators')
        .select('*, profile:profiles(full_name, phone)')
        .order('id');
      return (data ?? []) as Operator[];
    },
  });

  // hours this month
  const { data: hours = {} } = useQuery({
    queryKey: ['operator-hours'],
    queryFn: async () => {
      const start = new Date();
      start.setDate(1);
      const { data } = await supabase
        .from('operator_schedule')
        .select('operator_id, hours_logged')
        .gte('date', format(start, 'yyyy-MM-dd'));
      const map: Record<number, number> = {};
      data?.forEach((r: any) => {
        map[r.operator_id] = (map[r.operator_id] ?? 0) + Number(r.hours_logged);
      });
      return map;
    },
  });

  const openEdit = (op: Operator) => {
    setEditOp(op);
    setForm({ license_type: op.license_type ?? '', hourly_rate: op.hourly_rate ?? '' });
    setCerts(Object.entries(op.certifications ?? {}).map(([name, expiry]) => ({ name, expiry })));
  };

  const toggleAvailable = async (op: Operator) => {
    await supabase.from('operators').update({ available: !op.available }).eq('id', op.id);
    await logAudit('toggle_availability', 'operator', op.id, { available: !op.available });
    qc.invalidateQueries({ queryKey: ['operators'] });
  };

  const saveOperator = async () => {
    if (!editOp) return;
    setSaving(true);
    const certObj = certEntries.reduce(
      (acc, { name, expiry }) => (name ? { ...acc, [name]: expiry } : acc),
      {}
    );
    const payload = {
      license_type: form.license_type,
      hourly_rate: Number(form.hourly_rate) || null,
      certifications: certObj,
    };
    await supabase.from('operators').update(payload).eq('id', editOp.id);
    await logAudit('update', 'operator', editOp.id, payload);
    toast.success('Operator updated');
    setSaving(false);
    setEditOp(null);
    qc.invalidateQueries({ queryKey: ['operators'] });
  };

  const getRowClass = (op: Operator) => {
    const certs = Object.values(op.certifications ?? {});
    if (certs.some((d) => certStatus(d) === 'expired')) return 'bg-red-50';
    if (certs.some((d) => certStatus(d) === 'expiring')) return 'bg-yellow-50';
    return '';
  };

  const columns: Column<Operator>[] = [
    {
      key: 'name',
      header: 'Operator',
      render: (op) => (
        <div>
          <p className="font-medium text-ink-900">{op.profile?.full_name}</p>
          <p className="text-xs text-ink-500">{op.profile?.phone}</p>
        </div>
      ),
    },
    { key: 'license_type', header: 'License', render: (op) => op.license_type ?? '—' },
    {
      key: 'hourly_rate',
      header: 'Rate/hr',
      sortable: true,
      render: (op) => (op.hourly_rate ? `SAR ${op.hourly_rate}` : '—'),
    },
    {
      key: 'certifications',
      header: 'Certifications',
      render: (op) => (
        <div className="flex flex-wrap gap-1">
          {Object.entries(op.certifications ?? {}).map(([cert, expiry]) => {
            const st = certStatus(expiry);
            return (
              <span
                key={cert}
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium',
                  st === 'expired'
                    ? 'bg-red-100 text-red-700'
                    : st === 'expiring'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                )}
              >
                {st !== 'ok' && <AlertTriangle size={9} />}
                {cert}
              </span>
            );
          })}
        </div>
      ),
    },
    { key: 'hours', header: 'Hrs/Month', render: (op) => `${(hours as any)[op.id] ?? 0}h` },
    {
      key: 'available',
      header: 'Available',
      render: (op) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleAvailable(op);
          }}
          className={cn(
            'relative h-5 w-10 rounded-full transition-colors',
            op.available ? 'bg-green-500' : 'bg-cloud'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
              op.available ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (op) => (
        <Btn size="sm" variant="ghost" onClick={() => openEdit(op)}>
          Edit
        </Btn>
      ),
    },
  ];

  const expiredCount = operators.filter((op) =>
    Object.values(op.certifications ?? {}).some((d) => certStatus(d) === 'expired')
  ).length;
  const expiringCount = operators.filter((op) =>
    Object.values(op.certifications ?? {}).some((d) => certStatus(d) === 'expiring')
  ).length;

  return (
    <div>
      <PageHeader title="Operator Roster" subtitle={`${operators.length} operators`} />

      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="mb-4 flex gap-3">
          {expiredCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertTriangle size={14} /> {expiredCount} operator{expiredCount > 1 ? 's' : ''} with
              expired certifications
            </div>
          )}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
              <AlertTriangle size={14} /> {expiringCount} operator{expiringCount > 1 ? 's' : ''}{' '}
              with certifications expiring soon
            </div>
          )}
        </div>
      )}

      <DataTable
        data={operators}
        columns={columns}
        keyField="id"
        loading={isLoading}
        emptyState={<EmptyState icon={<HardHat size={40} />} title="No operators registered" />}
      />

      <Modal
        open={!!editOp}
        onClose={() => setEditOp(null)}
        title={`Edit — ${editOp?.profile?.full_name}`}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="License Type">
              <Input
                value={form.license_type}
                onChange={(e) => setForm((f: any) => ({ ...f, license_type: e.target.value }))}
                placeholder="e.g. Heavy Equipment"
              />
            </FormField>
            <FormField label="Hourly Rate (SAR)">
              <Input
                type="number"
                value={form.hourly_rate}
                onChange={(e) => setForm((f: any) => ({ ...f, hourly_rate: e.target.value }))}
              />
            </FormField>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-ink-700 text-xs font-semibold">Certifications</label>
              <button
                onClick={() => setCerts((c) => [...c, { name: '', expiry: '' }])}
                className="text-xs text-navy hover:underline"
              >
                + Add
              </button>
            </div>
            {certEntries.map((cert, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <Input
                  placeholder="Name (e.g. OSHA)"
                  value={cert.name}
                  onChange={(e) =>
                    setCerts((c) => c.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                  }
                />
                <Input
                  type="date"
                  value={cert.expiry}
                  onChange={(e) =>
                    setCerts((c) =>
                      c.map((x, j) => (j === i ? { ...x, expiry: e.target.value } : x))
                    )
                  }
                />
                <button
                  onClick={() => setCerts((c) => c.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setEditOp(null)}>
              Cancel
            </Btn>
            <Btn onClick={saveOperator} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Save'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
