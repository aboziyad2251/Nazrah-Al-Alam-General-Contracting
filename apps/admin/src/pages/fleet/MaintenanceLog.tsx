import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { Modal, Btn, FormField, Input, Textarea, EmptyState } from '@/components/ui/index';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Wrench } from 'lucide-react';

interface Props {
  equipment: { id: number; model_name: string };
  onClose: () => void;
}

const LOG_TYPES = ['routine', 'repair', 'inspection', 'oil_change', 'tyre', 'other'];

export default function MaintenanceLog({ equipment, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    type: 'routine',
    description: '',
    cost_sar: '',
    performed_by: '',
    performed_at: new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['maint-logs', equipment.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_logs')
        .select('*')
        .eq('equipment_id', equipment.id)
        .order('performed_at', { ascending: false });
      return data ?? [];
    },
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.description) {
      toast.error('Description required');
      return;
    }
    setSaving(true);
    const payload = {
      equipment_id: equipment.id,
      type: form.type,
      description: form.description,
      cost_sar: Number(form.cost_sar) || null,
      performed_by: form.performed_by || null,
      performed_at: form.performed_at,
    };
    const { data } = await supabase.from('maintenance_logs').insert(payload).select('id').single();
    if (data) await logAudit('create', 'maintenance_log', data.id, payload);
    toast.success('Log added');
    setSaving(false);
    setForm({
      type: 'routine',
      description: '',
      cost_sar: '',
      performed_by: '',
      performed_at: new Date().toISOString().slice(0, 16),
    });
    qc.invalidateQueries({ queryKey: ['maint-logs', equipment.id] });
  };

  return (
    <Modal open onClose={onClose} title={`Maintenance — ${equipment.model_name}`} width="max-w-2xl">
      <div className="grid grid-cols-2 gap-6">
        {/* Form */}
        <div>
          <p className="text-ink-700 mb-3 text-sm font-semibold">Add Log Entry</p>
          <FormField label="Type">
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              {LOG_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Work performed…"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Cost (SAR)">
              <Input
                type="number"
                value={form.cost_sar}
                onChange={(e) => set('cost_sar', e.target.value)}
                placeholder="0"
              />
            </FormField>
            <FormField label="Date">
              <Input
                type="datetime-local"
                value={form.performed_at}
                onChange={(e) => set('performed_at', e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Performed by">
            <Input
              value={form.performed_by}
              onChange={(e) => set('performed_by', e.target.value)}
              placeholder="Technician or vendor"
            />
          </FormField>
          <Btn onClick={save} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'Add Entry'}
          </Btn>
        </div>

        {/* History */}
        <div>
          <p className="text-ink-700 mb-3 text-sm font-semibold">History</p>
          {isLoading ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : logs.length === 0 ? (
            <EmptyState icon={<Wrench size={28} />} title="No logs yet" />
          ) : (
            <ul className="max-h-80 space-y-3 overflow-y-auto">
              {logs.map((log: any) => (
                <li key={log.id} className="rounded-lg border border-stone p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize text-navy">
                      {log.type?.replace('_', ' ')}
                    </span>
                    {log.cost_sar && (
                      <span className="text-xs text-ink-500">
                        SAR {Number(log.cost_sar).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-ink-700 text-sm">{log.description}</p>
                  <p className="mt-1 text-xs text-ink-500">
                    {log.performed_by && `${log.performed_by} · `}
                    {format(new Date(log.performed_at), 'MMM d, yyyy')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
