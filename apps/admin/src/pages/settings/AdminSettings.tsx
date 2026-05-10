import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import {
  PageHeader,
  Card,
  Btn,
  FormField,
  Input,
  Textarea,
  Modal,
  EmptyState,
} from '@/components/ui/index';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Shield,
  Users,
  Settings2,
  MessageSquare,
  Bot,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';

const TABS = ['Users & Roles', 'General', 'Templates', 'AI Models', 'Audit Log'] as const;
type Tab = (typeof TABS)[number];

const ROLES = ['client', 'operator', 'dispatcher', 'admin', 'super_admin'] as const;
const AI_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-7'];

// ── Users & Roles ─────────────────────────────────────────────────────────────
function UsersTab() {
  const { profile: me } = useAuthStore();
  const qc = useQueryClient();
  const isSuperAdmin = me?.role === 'super_admin';

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const changeRole = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      toast.error('Only super admins can change roles');
      return;
    }
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    await logAudit('change_role', 'profile', userId, { role: newRole });
    toast.success('Role updated');
    qc.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone bg-[#f8f9fb] text-left">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                Loading…
              </td>
            </tr>
          ) : (
            users.map((u: any) => (
              <tr key={u.id} className="border-b border-stone/40 hover:bg-stone/20">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{u.full_name ?? '—'}</p>
                  <p className="text-xs text-ink-500">{u.full_name_ar}</p>
                </td>
                <td className="text-ink-600 px-4 py-3">{u.company ?? '—'}</td>
                <td className="text-ink-600 px-4 py-3">{u.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  {isSuperAdmin && u.id !== me?.id ? (
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="rounded border border-cloud px-2 py-1 text-xs focus:outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'super_admin' ? 'bg-gold/20 text-gold' : u.role === 'admin' ? 'bg-navy/10 text-navy' : 'text-ink-600 bg-stone'}`}
                    >
                      {u.role?.replace('_', ' ')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-500">
                  {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}

// ── General settings ──────────────────────────────────────────────────────────
function GeneralTab() {
  const qc = useQueryClient();
  const [vatRate, setVatRate] = useState('0.15');
  const [currency, setCurrency] = useState('SAR');
  const [saving, setSaving] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*');
      return data ?? [];
    },
  });

  useEffect(() => {
    const vat = settings.find((s: any) => s.key === 'vat_rate');
    const cur = settings.find((s: any) => s.key === 'currency');
    if (vat) setVatRate(String(vat.value).replace(/"/g, ''));
    if (cur) setCurrency(String(cur.value).replace(/"/g, ''));
  }, [settings]);

  const save = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from('app_settings').upsert([
      {
        key: 'vat_rate',
        value: JSON.stringify(vatRate),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      },
      {
        key: 'currency',
        value: JSON.stringify(currency),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      },
    ]);
    await logAudit('update', 'app_settings', 'general', { vat_rate: vatRate, currency });
    toast.success('Settings saved');
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['app-settings'] });
  };

  return (
    <Card className="max-w-md p-6">
      <p className="mb-4 font-semibold text-ink-900">Company & Financial</p>
      <div className="space-y-4">
        <FormField label="VAT Rate (e.g. 0.15 = 15%)">
          <Input
            type="number"
            step="0.01"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          />
        </FormField>
        <FormField label="Currency">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none"
          >
            {['SAR', 'USD', 'AED', 'EUR'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
        <Btn onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Btn>
      </div>
    </Card>
  );
}

// ── Templates tab ─────────────────────────────────────────────────────────────
function TemplatesTab() {
  const qc = useQueryClient();
  const [editTpl, setEditTpl] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('message_templates').select('*').order('name');
      return data ?? [];
    },
  });

  const saveTpl = async () => {
    if (!editTpl) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from('message_templates')
      .update({
        subject_en: editTpl.subject_en,
        subject_ar: editTpl.subject_ar,
        body_en: editTpl.body_en,
        body_ar: editTpl.body_ar,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editTpl.id);
    await logAudit('update', 'message_template', editTpl.id, editTpl);
    toast.success('Template saved');
    setSaving(false);
    setEditTpl(null);
    qc.invalidateQueries({ queryKey: ['message-templates'] });
  };

  return (
    <div>
      <div className="space-y-3">
        {templates.map((t: any) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-ink-900">{t.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}
                >
                  {t.channel}
                </span>
                {t.variables?.length > 0 && (
                  <span className="text-xs text-ink-500">Variables: {t.variables.join(', ')}</span>
                )}
              </div>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => setEditTpl({ ...t })}>
              Edit
            </Btn>
          </Card>
        ))}
      </div>

      <Modal
        open={!!editTpl}
        onClose={() => setEditTpl(null)}
        title={`Edit Template: ${editTpl?.name}`}
        width="max-w-2xl"
      >
        {editTpl && (
          <div className="space-y-3">
            {editTpl.channel === 'email' && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Subject (EN)">
                  <Input
                    value={editTpl.subject_en ?? ''}
                    onChange={(e) => setEditTpl((t: any) => ({ ...t, subject_en: e.target.value }))}
                  />
                </FormField>
                <FormField label="Subject (AR)">
                  <Input
                    dir="rtl"
                    value={editTpl.subject_ar ?? ''}
                    onChange={(e) => setEditTpl((t: any) => ({ ...t, subject_ar: e.target.value }))}
                  />
                </FormField>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Body (EN)">
                <Textarea
                  value={editTpl.body_en}
                  onChange={(e) => setEditTpl((t: any) => ({ ...t, body_en: e.target.value }))}
                  rows={8}
                />
              </FormField>
              <FormField label="Body (AR)">
                <Textarea
                  dir="rtl"
                  value={editTpl.body_ar}
                  onChange={(e) => setEditTpl((t: any) => ({ ...t, body_ar: e.target.value }))}
                  rows={8}
                />
              </FormField>
            </div>
            {editTpl.variables?.length > 0 && (
              <p className="text-xs text-ink-500">
                Available variables:{' '}
                {(editTpl.variables as string[]).map((v) => `{{${v}}}`).join(', ')}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setEditTpl(null)}>
                Cancel
              </Btn>
              <Btn onClick={saveTpl} disabled={saving} className="flex-1">
                {saving ? 'Saving…' : 'Save Template'}
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── AI Models tab ─────────────────────────────────────────────────────────────
function AIModelsTab() {
  const qc = useQueryClient();
  const [models, setModels] = useState({
    ai_quote_model: 'claude-sonnet-4-6',
    ai_assistant_model: 'claude-sonnet-4-6',
    ai_survey_model: 'claude-sonnet-4-6',
  });
  const [saving, setSaving] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ['app-settings-ai'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .in('key', ['ai_quote_model', 'ai_assistant_model', 'ai_survey_model']);
      return data ?? [];
    },
  });

  useEffect(() => {
    const m: any = {};
    settings.forEach((s: any) => {
      m[s.key] = String(s.value).replace(/"/g, '');
    });
    if (Object.keys(m).length) setModels((prev) => ({ ...prev, ...m }));
  }, [settings]);

  const save = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from('app_settings').upsert(
      Object.entries(models).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      }))
    );
    await logAudit('update', 'app_settings', 'ai_models', models);
    toast.success('AI model preferences saved');
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['app-settings-ai'] });
  };

  const tasks = [
    {
      key: 'ai_quote_model',
      label: 'Quote Summary',
      desc: 'Used to generate professional quote summaries',
    },
    {
      key: 'ai_assistant_model',
      label: 'Client Assistant',
      desc: 'Powers the client-facing AI chat',
    },
    {
      key: 'ai_survey_model',
      label: 'Site Survey',
      desc: 'Analyzes site photos for equipment recommendations',
    },
  ] as const;

  return (
    <Card className="max-w-lg p-6">
      <p className="mb-1 font-semibold text-ink-900">AI Model Preferences</p>
      <p className="mb-5 text-xs text-ink-500">Select which Claude model powers each AI task.</p>
      <div className="space-y-5">
        {tasks.map(({ key, label, desc }) => (
          <div key={key}>
            <label className="text-ink-700 mb-0.5 block text-sm font-semibold">{label}</label>
            <p className="mb-1 text-xs text-ink-500">{desc}</p>
            <select
              value={(models as any)[key]}
              onChange={(e) => setModels((m) => ({ ...m, [key]: e.target.value }))}
              className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none"
            >
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <Btn onClick={save} disabled={saving} className="mt-5">
        {saving ? 'Saving…' : 'Save Preferences'}
      </Btn>
    </Card>
  );
}

// ── Audit Log tab ─────────────────────────────────────────────────────────────
function AuditLogTab() {
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-log', entityFilter, page],
    queryFn: async () => {
      let q = supabase
        .from('audit_log')
        .select('*, actor:profiles(full_name)')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (entityFilter) q = q.eq('entity', entityFilter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const ENTITIES = [
    'equipment',
    'quote',
    'booking',
    'invoice',
    'operator',
    'lead',
    'profile',
    'vendor',
    'blog_post',
    'cms_homepage',
    'app_settings',
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-cloud px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">All entities</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone bg-[#f8f9fb] text-left">
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-500">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="py-12">
                    <EmptyState icon={<ClipboardList size={40} />} title="No audit entries" />
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="border-b border-stone/40 text-xs hover:bg-stone/20">
                  <td className="text-ink-700 px-4 py-2">{log.actor?.full_name ?? 'System'}</td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-stone/60 px-1.5 py-0.5 font-mono text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="text-ink-600 px-4 py-2">{log.entity}</td>
                  <td className="text-ink-400 px-4 py-2 font-mono">{log.entity_id}</td>
                  <td className="text-ink-400 px-4 py-2">
                    {log.created_at ? format(new Date(log.created_at), 'MMM d, HH:mm') : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-stone px-4 py-3">
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </Btn>
          <span className="text-xs text-ink-500">Page {page + 1}</span>
          <Btn
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length < PAGE_SIZE}
          >
            Next →
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ── Main settings page ────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('Users & Roles');

  const tabIcons: Record<Tab, React.ElementType> = {
    'Users & Roles': Users,
    General: Settings2,
    Templates: MessageSquare,
    'AI Models': Bot,
    'Audit Log': ClipboardList,
  };

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="mb-6 flex gap-1 border-b border-stone">
        {TABS.map((t) => {
          const Icon = tabIcons[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? 'border-navy text-navy'
                  : 'border-transparent text-ink-500 hover:text-ink-900'
              }`}
            >
              <Icon size={14} />
              {t}
            </button>
          );
        })}
      </div>

      {tab === 'Users & Roles' && <UsersTab />}
      {tab === 'General' && <GeneralTab />}
      {tab === 'Templates' && <TemplatesTab />}
      {tab === 'AI Models' && <AIModelsTab />}
      {tab === 'Audit Log' && <AuditLogTab />}
    </div>
  );
}
