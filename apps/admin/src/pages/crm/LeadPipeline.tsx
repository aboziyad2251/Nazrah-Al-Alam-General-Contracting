import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import {
  PageHeader,
  Card,
  StatusBadge,
  Modal,
  Btn,
  FormField,
  Input,
  Textarea,
} from '@/components/ui/index';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { Plus, DollarSign, UserPlus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = [
  { key: 'new', label: 'New', color: 'border-gray-300 bg-gray-50' },
  { key: 'contacted', label: 'Contacted', color: 'border-blue-300 bg-blue-50' },
  { key: 'qualified', label: 'Qualified', color: 'border-indigo-300 bg-indigo-50' },
  { key: 'proposal', label: 'Proposal', color: 'border-purple-300 bg-purple-50' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-orange-300 bg-orange-50' },
  { key: 'won', label: 'Won', color: 'border-green-300 bg-green-50' },
  { key: 'lost', label: 'Lost', color: 'border-red-300 bg-red-50' },
];

function LeadCard({ lead, onSelect }: { lead: any; onSelect: (l: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(lead)}
      className="cursor-pointer rounded-lg border border-stone bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-semibold text-ink-900">{lead.company_name}</p>
        {lead.converted_profile_id && (
          <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
            CLIENT
          </span>
        )}
      </div>
      {lead.contact_name && <p className="text-xs text-ink-500">{lead.contact_name}</p>}
      {lead.email && <p className="text-ink-400 truncate text-xs">{lead.email}</p>}
      {lead.value_sar && (
        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
          <DollarSign size={10} />
          SAR {Number(lead.value_sar).toLocaleString()}
        </div>
      )}
      <p className="text-ink-400 mt-1 text-[10px]">{format(new Date(lead.created_at), 'MMM d')}</p>
    </div>
  );
}

const EMPTY_FORM = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  stage: 'new',
  value_sar: '',
  source: '',
};

const EMPTY_CONVERT = {
  email: '',
  full_name: '',
  company: '',
  vat_number: '',
  billing_address: '',
  phone: '',
};

export default function LeadPipelinePage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Lead detail panel
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({ ...EMPTY_CONVERT });
  const [converting, setConverting] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const leadId = Number(active.id);
    const newStage = String(over.id);
    const lead = leads.find((l: any) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;
    await supabase
      .from('leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId);
    await logAudit('stage_change', 'lead', leadId, { from: lead.stage, to: newStage });
    toast.success(`Lead moved to ${newStage}`);
    qc.invalidateQueries({ queryKey: ['leads'] });
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setC = (k: string, v: string) => setConvertForm((f) => ({ ...f, [k]: v }));

  const saveLead = async () => {
    if (!form.company_name) {
      toast.error('Company name required');
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('leads')
      .insert({
        company_name: form.company_name,
        contact_name: form.contact_name || null,
        email: form.email || null,
        phone: form.phone || null,
        stage: form.stage,
        value_sar: form.value_sar ? Number(form.value_sar) : null,
        source: form.source || null,
        created_by: user?.id,
      })
      .select('id')
      .single();
    if (data) await logAudit('create', 'lead', data.id, form);
    toast.success('Lead added');
    setSaving(false);
    setAddOpen(false);
    setForm({ ...EMPTY_FORM });
    qc.invalidateQueries({ queryKey: ['leads'] });
  };

  const openConvert = (lead: any) => {
    setConvertForm({
      email: lead.email ?? '',
      full_name: lead.contact_name ?? '',
      company: lead.company_name ?? '',
      vat_number: '',
      billing_address: '',
      phone: lead.phone ?? '',
    });
    setConvertOpen(true);
  };

  const convertLead = async () => {
    if (!convertForm.email || !selectedLead) {
      toast.error('Email required');
      return;
    }
    setConverting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ lead_id: selectedLead.id, ...convertForm }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'Conversion failed');
      await logAudit('convert_to_client', 'lead', selectedLead.id, { email: convertForm.email });
      toast.success(`Invite sent to ${convertForm.email}`);
      setConvertOpen(false);
      setSelectedLead(null);
      qc.invalidateQueries({ queryKey: ['leads'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const grouped = STAGES.reduce(
    (acc, s) => {
      acc[s.key] = leads.filter((l: any) => l.stage === s.key);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const totalPipeline = leads.reduce((s: number, l: any) => s + Number(l.value_sar ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Lead Pipeline"
        subtitle={`Total pipeline: SAR ${totalPipeline.toLocaleString()}`}
        action={
          <Btn onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add Lead
          </Btn>
        }
      />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage.key} className="w-52 flex-shrink-0">
              <div
                className={`rounded-lg border ${stage.color} mb-2 flex items-center justify-between px-3 py-2`}
              >
                <span className="text-ink-700 text-xs font-semibold">{stage.label}</span>
                <span className="text-xs text-ink-500">{grouped[stage.key]?.length ?? 0}</span>
              </div>
              <SortableContext
                id={stage.key}
                items={grouped[stage.key]?.map((l: any) => l.id) ?? []}
                strategy={verticalListSortingStrategy}
              >
                <div className="min-h-20 space-y-2 rounded-lg bg-stone/20 p-2">
                  {grouped[stage.key]?.map((lead: any) => (
                    <LeadCard key={lead.id} lead={lead} onSelect={setSelectedLead} />
                  ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {/* Add Lead Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Lead">
        <div className="space-y-3">
          <FormField label="Company Name *">
            <Input
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              placeholder="ACME Construction"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Name">
              <Input
                value={form.contact_name}
                onChange={(e) => set('contact_name', e.target.value)}
              />
            </FormField>
            <FormField label="Stage">
              <select
                value={form.stage}
                onChange={(e) => set('stage', e.target.value)}
                className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Est. Value (SAR)">
              <Input
                type="number"
                value={form.value_sar}
                onChange={(e) => set('value_sar', e.target.value)}
              />
            </FormField>
            <FormField label="Source">
              <Input
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                placeholder="Referral, web…"
              />
            </FormField>
          </div>
          <div className="flex gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={saveLead} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Add Lead'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Lead Detail Panel */}
      <Modal
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.company_name ?? 'Lead Detail'}
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-ink-500">Contact</p>
                <p className="text-ink-900">{selectedLead.contact_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500">Stage</p>
                <StatusBadge status={selectedLead.stage} />
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500">Email</p>
                <p className="text-ink-900">{selectedLead.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500">Phone</p>
                <p className="text-ink-900">{selectedLead.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500">Est. Value</p>
                <p className="font-semibold text-green-600">
                  {selectedLead.value_sar
                    ? `SAR ${Number(selectedLead.value_sar).toLocaleString()}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-500">Source</p>
                <p className="text-ink-900">{selectedLead.source || '—'}</p>
              </div>
            </div>

            {selectedLead.notes && (
              <div>
                <p className="text-xs font-semibold text-ink-500">Notes</p>
                <p className="text-ink-700 mt-1 whitespace-pre-wrap text-sm">
                  {selectedLead.notes}
                </p>
              </div>
            )}

            {selectedLead.converted_profile_id ? (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                ✅ Converted to client on{' '}
                {selectedLead.converted_at
                  ? format(new Date(selectedLead.converted_at), 'dd MMM yyyy')
                  : '—'}
              </div>
            ) : (
              <Btn onClick={() => openConvert(selectedLead)} className="w-full justify-center">
                <UserPlus size={14} /> Convert to Client
              </Btn>
            )}

            <Btn
              variant="secondary"
              onClick={() => setSelectedLead(null)}
              className="w-full justify-center"
            >
              Close
            </Btn>
          </div>
        )}
      </Modal>

      {/* Convert to Client Modal */}
      <Modal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        title="Convert to Portal Client"
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-500">
            An invite email will be sent to the client. They'll be prompted to set a password and
            complete onboarding.
          </p>
          <FormField label="Email *">
            <Input
              type="email"
              value={convertForm.email}
              onChange={(e) => setC('email', e.target.value)}
              placeholder="client@company.com"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Full Name">
              <Input
                value={convertForm.full_name}
                onChange={(e) => setC('full_name', e.target.value)}
              />
            </FormField>
            <FormField label="Company">
              <Input
                value={convertForm.company}
                onChange={(e) => setC('company', e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone">
              <Input value={convertForm.phone} onChange={(e) => setC('phone', e.target.value)} />
            </FormField>
            <FormField label="VAT Number">
              <Input
                value={convertForm.vat_number}
                onChange={(e) => setC('vat_number', e.target.value)}
                placeholder="3xxxxxxxxxxxxxxxxx"
              />
            </FormField>
          </div>
          <FormField label="Billing Address">
            <Input
              value={convertForm.billing_address}
              onChange={(e) => setC('billing_address', e.target.value)}
            />
          </FormField>
          <div className="flex gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setConvertOpen(false)}>
              Cancel
            </Btn>
            <Btn onClick={convertLead} disabled={converting} className="flex-1 justify-center">
              {converting ? 'Sending Invite…' : 'Send Invite & Convert'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
