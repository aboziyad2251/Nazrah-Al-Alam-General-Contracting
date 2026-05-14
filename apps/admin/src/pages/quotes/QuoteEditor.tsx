import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { useAuthStore } from '@/stores/authStore';
import {
  PageHeader,
  Card,
  Btn,
  FormField,
  Input,
  Textarea,
  StatusBadge,
} from '@/components/ui/index';
import { toast } from 'sonner';
import {
  Plus,
  X,
  Sparkles,
  Printer,
  ArrowLeft,
  Send,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

const VAT = 0.15;

interface LineItem {
  equipment_id: number | null;
  description: string;
  qty: number;
  days: number;
  unit_rate: number;
  with_operator: boolean;
}

interface AiSummaryResult {
  headline: string;
  narrative: string;
  recommendations: string[];
  risk_flags: string[];
  next_steps: string[];
}

export default function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, user } = useAuthStore();
  const isNew = id === 'new';
  const [header, setHeader] = useState({
    client_id: '',
    project_name: '',
    project_location: '',
    start_date: '',
    end_date: '',
  });
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [aiSummary, setAiSummary] = useState<AiSummaryResult | null>(null);
  const [aiStreamText, setAiStreamText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState('draft');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, profile:profiles(full_name, company)');
      return data ?? [];
    },
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment-select'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment')
        .select('id, model_name, brand, daily_rate_sar')
        .eq('status', 'available');
      return data ?? [];
    },
  });

  const { data: existingQuote } = useQuery({
    queryKey: ['quote-detail', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*, quote_items(*)')
        .eq('id', id!)
        .single();
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existingQuote) {
      setHeader({
        client_id: String(existingQuote.client_id),
        project_name: existingQuote.project_name ?? '',
        project_location: existingQuote.project_location ?? '',
        start_date: existingQuote.start_date ?? '',
        end_date: existingQuote.end_date ?? '',
      });
      setNotes(existingQuote.notes ?? '');
      setQuoteStatus(existingQuote.status);
      // Try to parse stored ai_summary JSON
      if (existingQuote.ai_summary) {
        try {
          setAiSummary(JSON.parse(existingQuote.ai_summary));
        } catch {
          /* plain text legacy — ignore */
        }
      }
      setItems(
        (existingQuote.quote_items ?? []).map((qi: Record<string, unknown>) => ({
          equipment_id: qi.equipment_id as number | null,
          description: '',
          qty: qi.qty as number,
          days: qi.days as number,
          unit_rate: Number(qi.unit_rate),
          with_operator: qi.with_operator as boolean,
        }))
      );
    }
  }, [existingQuote]);

  const addLine = () =>
    setItems((i) => [
      ...i,
      { equipment_id: null, description: '', qty: 1, days: 1, unit_rate: 0, with_operator: false },
    ]);

  const removeLine = (idx: number) => setItems((i) => i.filter((_, j) => j !== idx));

  const updateLine = (idx: number, patch: Partial<LineItem>) =>
    setItems((i) =>
      i.map((item, j) => {
        if (j !== idx) return item;
        const updated = { ...item, ...patch };
        if (patch.equipment_id) {
          const eq = equipment.find((e: Record<string, unknown>) => e.id === patch.equipment_id);
          if (eq) updated.unit_rate = Number((eq as Record<string, unknown>).daily_rate_sar ?? 0);
        }
        return updated;
      })
    );

  const subtotal = items.reduce((s, i) => s + i.qty * i.days * i.unit_rate, 0);
  const vatAmt = subtotal * VAT;
  const total = subtotal + vatAmt;

  const selectedClient = clients.find(
    (c: Record<string, unknown>) => String(c.id) === header.client_id
  ) as Record<string, unknown> | undefined;
  const clientName =
    ((selectedClient?.profile as Record<string, unknown>)?.company as string) ??
    ((selectedClient?.profile as Record<string, unknown>)?.full_name as string) ??
    '';

  // ── quote_summary (streaming SSE) ────────────────────────────────────────
  const generateSummary = async () => {
    if (!items.length) {
      toast.error('Add line items first');
      return;
    }
    if (!session) {
      toast.error('Not authenticated');
      return;
    }

    setAiLoading(true);
    setAiStreamText('');
    setAiSummary(null);

    const lineItems = items.map((item) => {
      const eq = equipment.find((e: Record<string, unknown>) => e.id === item.equipment_id) as
        | Record<string, unknown>
        | undefined;
      return {
        name: (eq?.model_name as string) ?? item.description ?? 'Equipment',
        qty: item.qty,
        days: item.days,
        unit_rate: item.unit_rate,
        line_total_sar: item.qty * item.days * item.unit_rate,
        with_operator: item.with_operator,
      };
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'quote_summary',
          payload: {
            client: clientName,
            project: header.project_name,
            items: lineItems,
            subtotal_sar: subtotal,
            vat_sar: vatAmt,
            total_sar: total,
            start_date: header.start_date || undefined,
            end_date: header.end_date || undefined,
          },
          user_id: user!.id,
          locale: 'en',
        }),
      });

      if (!res.ok || !res.body) {
        toast.error('AI gateway error');
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          let ev: { type: string; text?: string; message?: string };
          try {
            ev = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
          if (ev.type === 'delta') {
            buf += ev.text ?? '';
            setAiStreamText(buf);
          }
          if (ev.type === 'done') break;
          if (ev.type === 'error') {
            toast.error(ev.message ?? 'AI error');
            return;
          }
        }
      }

      // buf should now be the full JSON string from the model
      try {
        const parsed: AiSummaryResult = JSON.parse(buf);
        setAiSummary(parsed);
        setAiStreamText('');
        toast.success('AI summary generated');
      } catch {
        // Model returned something non-JSON — show as plain text
        setAiStreamText(buf);
        toast.success('Summary generated');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to reach AI gateway');
    } finally {
      setAiLoading(false);
    }
  };

  // ── contract_draft (non-streaming) ───────────────────────────────────────
  const generateContract = async () => {
    if (!header.client_id || !header.project_name) {
      toast.error('Select a client and enter a project name first');
      return;
    }
    if (!session) {
      toast.error('Not authenticated');
      return;
    }

    setContractLoading(true);

    const lineItems = items.map((item, idx) => {
      const eq = equipment.find((e: Record<string, unknown>) => e.id === item.equipment_id) as
        | Record<string, unknown>
        | undefined;
      return {
        equipment_model: (eq?.model_name as string) ?? item.description ?? 'Equipment',
        qty: item.qty,
        days: item.days,
        unit_rate: item.unit_rate,
        line_total_sar: item.qty * item.days * item.unit_rate,
        with_operator: item.with_operator,
        serial_no: `{{serial_${idx + 1}}}`,
      };
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'contract_draft',
          payload: {
            client: clientName,
            project: header.project_name,
            value: total,
            duration:
              header.start_date && header.end_date
                ? `${format(new Date(header.start_date), 'dd MMM yyyy')} – ${format(new Date(header.end_date), 'dd MMM yyyy')}`
                : 'To be agreed',
            location: header.project_location || undefined,
            items: lineItems,
          },
          user_id: user!.id,
          locale: 'en',
        }),
      });

      if (!res.ok) {
        toast.error('Contract generation failed');
        return;
      }

      const json = await res.json();
      const markdown: string = json.content ?? '';

      // Trigger download as .md file
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${header.project_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Contract draft downloaded');
      await logAudit('generate_contract', 'quote', isNew ? null : Number(id), {
        project: header.project_name,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate contract');
    } finally {
      setContractLoading(false);
    }
  };

  const save = async (sendNow = false) => {
    if (!header.client_id || !header.project_name) {
      toast.error('Client and project name required');
      return;
    }
    setSaving(true);
    const status = sendNow ? 'sent' : isNew ? 'draft' : quoteStatus;
    const payload = {
      client_id: Number(header.client_id),
      project_name: header.project_name,
      project_location: header.project_location,
      start_date: header.start_date || null,
      end_date: header.end_date || null,
      total_sar: total,
      notes: notes || null,
      ai_summary: aiSummary ? JSON.stringify(aiSummary) : null,
      status,
    };

    let quoteId = isNew ? null : Number(id);
    if (isNew) {
      const { data } = await supabase.from('quotes').insert(payload).select('id').single();
      quoteId = data?.id;
      await logAudit('create', 'quote', quoteId!, payload);
    } else {
      await supabase.from('quotes').update(payload).eq('id', quoteId!);
      await logAudit('update', 'quote', quoteId!, payload);
    }

    if (quoteId) {
      await supabase.from('quote_items').delete().eq('quote_id', quoteId);
      const linePayloads = items.map((i) => ({
        quote_id: quoteId,
        equipment_id: i.equipment_id,
        qty: i.qty,
        days: i.days,
        unit_rate: i.unit_rate,
        with_operator: i.with_operator,
      }));
      if (linePayloads.length) await supabase.from('quote_items').insert(linePayloads);
    }

    toast.success(sendNow ? 'Quote sent!' : 'Quote saved');
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['admin-quotes'] });
    if (isNew && quoteId) navigate(`/quotes/${quoteId}`, { replace: true });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/quotes')}
        className="mb-4 flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={14} /> Back to quotes
      </button>

      <PageHeader
        title={isNew ? 'New Quote' : `Quote #${id}`}
        subtitle={
          !isNew ? ((<StatusBadge status={quoteStatus} />) as unknown as string) : undefined
        }
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer size={14} /> Print PDF
            </Btn>
            <Btn
              variant="secondary"
              size="sm"
              onClick={generateContract}
              disabled={contractLoading || !header.client_id || !header.project_name}
            >
              <FileText size={14} />
              {contractLoading ? 'Drafting…' : 'Draft Contract'}
            </Btn>
            <Btn variant="secondary" onClick={() => save(false)} disabled={saving}>
              Save Draft
            </Btn>
            <Btn onClick={() => save(true)} disabled={saving}>
              <Send size={14} /> Save & Send
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* Header */}
          <Card className="p-5">
            <p className="mb-4 font-semibold text-ink-900">Project Details</p>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Client *">
                <select
                  value={header.client_id}
                  onChange={(e) => setHeader((h) => ({ ...h, client_id: e.target.value }))}
                  className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
                >
                  <option value="">Select client…</option>
                  {clients.map((c: Record<string, unknown>) => (
                    <option key={c.id as number} value={c.id as number}>
                      {((c.profile as Record<string, unknown>)?.company as string) ??
                        ((c.profile as Record<string, unknown>)?.full_name as string)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Project Name *">
                <Input
                  value={header.project_name}
                  onChange={(e) => setHeader((h) => ({ ...h, project_name: e.target.value }))}
                  placeholder="Riyadh Office Tower"
                />
              </FormField>
              <FormField label="Location">
                <Input
                  value={header.project_location}
                  onChange={(e) => setHeader((h) => ({ ...h, project_location: e.target.value }))}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Start Date">
                  <Input
                    type="date"
                    value={header.start_date}
                    onChange={(e) => setHeader((h) => ({ ...h, start_date: e.target.value }))}
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="date"
                    value={header.end_date}
                    onChange={(e) => setHeader((h) => ({ ...h, end_date: e.target.value }))}
                  />
                </FormField>
              </div>
            </div>
          </Card>

          {/* Line items */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-ink-900">Line Items</p>
              <Btn size="sm" onClick={addLine}>
                <Plus size={12} /> Add Line
              </Btn>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone text-left text-xs text-ink-500">
                  <th className="pb-2">Equipment</th>
                  <th className="w-16 pb-2">Qty</th>
                  <th className="w-16 pb-2">Days</th>
                  <th className="w-28 pb-2">Unit Rate (SAR)</th>
                  <th className="w-20 pb-2">+Op</th>
                  <th className="w-24 pb-2 text-right">Total</th>
                  <th className="w-8 pb-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const lineTotal = item.qty * item.days * item.unit_rate;
                  return (
                    <tr key={i} className="border-b border-stone/40">
                      <td className="py-2 pr-2">
                        <select
                          value={item.equipment_id ?? ''}
                          onChange={(e) =>
                            updateLine(i, { equipment_id: Number(e.target.value) || null })
                          }
                          className="w-full rounded border border-cloud px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="">Select…</option>
                          {equipment.map((e: Record<string, unknown>) => (
                            <option key={e.id as number} value={e.id as number}>
                              {e.model_name as string} ({e.brand as string})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
                          className="w-full rounded border border-cloud px-2 py-1 text-center text-xs focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={1}
                          value={item.days}
                          onChange={(e) => updateLine(i, { days: Number(e.target.value) })}
                          className="w-full rounded border border-cloud px-2 py-1 text-center text-xs focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={item.unit_rate}
                          onChange={(e) => updateLine(i, { unit_rate: Number(e.target.value) })}
                          className="w-full rounded border border-cloud px-2 py-1 text-xs focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.with_operator}
                          onChange={(e) => updateLine(i, { with_operator: e.target.checked })}
                          className="accent-navy"
                        />
                      </td>
                      <td className="py-2 text-right font-medium">
                        SAR {lineTotal.toLocaleString()}
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-500">No line items yet</p>
            )}
          </Card>

          {/* AI Summary */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-ink-900">AI Quote Summary</p>
              <Btn
                size="sm"
                variant="secondary"
                onClick={generateSummary}
                disabled={aiLoading || items.length === 0}
              >
                <Sparkles size={12} className="text-gold" />
                {aiLoading ? 'Generating…' : 'Generate'}
              </Btn>
            </div>

            {/* Streaming text while loading */}
            {aiLoading && aiStreamText && (
              <div className="text-ink-600 whitespace-pre-wrap rounded-lg bg-stone/30 p-3 font-mono text-sm">
                {aiStreamText}
                <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-navy" />
              </div>
            )}

            {/* Structured result */}
            {!aiLoading && aiSummary && (
              <div className="space-y-4">
                <p className="text-base font-semibold text-ink-900">{aiSummary.headline}</p>
                <p className="text-ink-600 text-sm leading-relaxed">{aiSummary.narrative}</p>

                {aiSummary.recommendations.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      Recommendations
                    </p>
                    <ul className="space-y-1">
                      {aiSummary.recommendations.map((r, i) => (
                        <li key={i} className="text-ink-700 flex items-start gap-2 text-sm">
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiSummary.risk_flags.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      Risk Flags
                    </p>
                    <ul className="space-y-1">
                      {aiSummary.risk_flags.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiSummary.next_steps.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      Next Steps
                    </p>
                    <ol className="list-inside list-decimal space-y-1">
                      {aiSummary.next_steps.map((s, i) => (
                        <li key={i} className="text-ink-700 text-sm">
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* Fallback plain text */}
            {!aiLoading && !aiSummary && aiStreamText && (
              <p className="text-ink-600 whitespace-pre-wrap text-sm leading-relaxed">
                {aiStreamText}
              </p>
            )}

            {!aiLoading && !aiSummary && !aiStreamText && (
              <p className="text-sm italic text-ink-500">
                Click Generate to create an AI-powered summary with recommendations and next steps.
              </p>
            )}
          </Card>

          {/* Internal notes */}
          <Card className="p-5">
            <p className="mb-2 font-semibold text-ink-900">Internal Notes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes visible to admin only…"
            />
          </Card>
        </div>

        {/* Summary sidebar */}
        <div>
          <Card className="sticky top-20 space-y-4 p-5">
            <p className="font-semibold text-ink-900">Quote Summary</p>
            <div className="space-y-2 text-sm">
              <div className="text-ink-600 flex justify-between">
                <span>Subtotal</span>
                <span>SAR {subtotal.toLocaleString()}</span>
              </div>
              <div className="text-ink-600 flex justify-between">
                <span>VAT (15%)</span>
                <span>SAR {vatAmt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-stone pt-2 font-bold text-ink-900">
                <span>Total</span>
                <span>SAR {total.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Btn className="w-full" onClick={() => save(false)} disabled={saving}>
                Save Draft
              </Btn>
              <Btn
                className="w-full"
                variant="secondary"
                onClick={() => save(true)}
                disabled={saving}
              >
                <Send size={12} /> Mark as Sent
              </Btn>
              <Btn
                className="w-full"
                variant="secondary"
                onClick={generateContract}
                disabled={contractLoading || !header.client_id || !header.project_name}
              >
                <FileText size={12} />
                {contractLoading ? 'Drafting…' : 'Draft Contract (.md)'}
              </Btn>
            </div>
            {contractLoading && (
              <p className="text-center text-xs text-ink-500">Drafting bilingual contract…</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
