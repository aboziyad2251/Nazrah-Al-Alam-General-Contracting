import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Trash2,
  Plus,
  Minus,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { Link } from 'react-router-dom';

const STEPS = ['Project Info', 'Equipment', 'Operators', 'Summary', 'Submit'];

export default function QuoteBuilderPage() {
  const navigate = useNavigate();
  const { locale } = useUIStore();
  const { user } = useAuthStore();
  const {
    items,
    projectName,
    projectLocation,
    startDate,
    endDate,
    step,
    setStep,
    setProjectInfo,
    updateItem,
    removeItem,
    totalSAR,
    clearCart,
  } = useCartStore();
  const [submitting, setSubmitting] = useState(false);

  const VAT_RATE = 0.15;
  const subtotal = totalSAR();
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;

  const submitQuote = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      if (!client) {
        toast.error('Client profile not found. Complete onboarding first.');
        return;
      }

      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          client_id: client.id,
          status: 'sent',
          project_name: projectName,
          project_location: projectLocation,
          start_date: startDate || null,
          end_date: endDate || null,
          total_sar: total,
          currency: 'SAR',
        })
        .select('id')
        .single();

      if (error || !quote) {
        toast.error(error?.message ?? 'Failed to create quote');
        return;
      }

      await supabase.from('quote_items').insert(
        items.map((i) => ({
          quote_id: quote.id,
          equipment_id: i.equipment_id,
          qty: i.qty,
          days: i.days,
          unit_rate: i.daily_rate_sar,
          with_operator: i.with_operator,
        }))
      );

      clearCart();
      toast.success('Quote submitted successfully!');
      navigate(`/quotes`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={locale === 'ar' ? 'بناء عرض السعر' : 'Quote Builder'}
        subtitle={
          locale === 'ar'
            ? 'أكمل الخطوات لإرسال طلب عرض سعر.'
            : 'Complete the steps to submit your quote request.'
        }
      />

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i < step
                    ? 'bg-emerald-500 text-white'
                    : i === step
                      ? 'bg-[#0E1F3A] text-white'
                      : 'bg-[#E8EAED] text-[#5A6573]'
                }`}
              >
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className="mt-1 hidden text-[10px] text-[#5A6573] sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 ${i < step ? 'bg-emerald-500' : 'bg-[#E8EAED]'}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E8EAED] bg-white p-6">
        {/* Step 1: Project Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#0F1117]">Project Information</h3>
            <Field
              label="Project Name"
              value={projectName}
              onChange={(v) => setProjectInfo({ projectName: v })}
              placeholder="e.g. Al Nuzlah Residential Development"
            />
            <Field
              label="Project Location / Site Address"
              value={projectLocation}
              onChange={(v) => setProjectInfo({ projectLocation: v })}
              placeholder="e.g. Al Nuzlah Al Sharqia, Jeddah"
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Start Date"
                value={startDate}
                onChange={(v) => setProjectInfo({ startDate: v })}
                type="date"
              />
              <Field
                label="End Date"
                value={endDate}
                onChange={(v) => setProjectInfo({ endDate: v })}
                type="date"
              />
            </div>
          </div>
        )}

        {/* Step 2: Equipment list */}
        {step === 1 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#0F1117]">Equipment Selection</h3>
              <Link
                to="/catalog"
                className="flex items-center gap-1 text-sm text-[#0E1F3A] hover:underline"
              >
                <Plus size={14} /> Browse Catalog
              </Link>
            </div>
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-[#5A6573]">
                  No equipment selected. Go to the catalog to add items.
                </p>
                <Link
                  to="/catalog"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0E1F3A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1628]"
                >
                  <Plus size={16} /> Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.equipment_id}
                    className="flex items-center gap-4 rounded-xl bg-[#D9DCE0] p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0F1117]">{item.model_name}</p>
                      <p className="text-xs text-[#5A6573]">
                        {item.brand} · SAR {item.daily_rate_sar}/day
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateItem(item.equipment_id, { days: Math.max(1, item.days - 1) })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white hover:bg-[#E8EAED]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-16 text-center text-sm font-medium">
                        {item.days}d × {item.qty}
                      </span>
                      <button
                        onClick={() => updateItem(item.equipment_id, { days: item.days + 1 })}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white hover:bg-[#E8EAED]"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="w-24 text-right text-sm font-bold text-[#0E1F3A]">
                      SAR {(item.daily_rate_sar * item.qty * item.days).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeItem(item.equipment_id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Operators */}
        {step === 2 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[#0F1117]">Operator Options</h3>
            <p className="mb-4 text-sm text-[#5A6573]">
              Toggle operator inclusion per equipment. Operators are charged separately at contract
              time.
            </p>
            {items.map((item) => (
              <div
                key={item.equipment_id}
                className="mb-3 flex items-center justify-between rounded-xl bg-[#D9DCE0] p-4"
              >
                <div>
                  <p className="text-sm font-medium text-[#0F1117]">{item.model_name}</p>
                  <p className="text-xs text-[#5A6573]">{item.brand}</p>
                </div>
                <button
                  onClick={() =>
                    updateItem(item.equipment_id, { with_operator: !item.with_operator })
                  }
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all ${
                    item.with_operator
                      ? 'border-[#0E1F3A] bg-[#0E1F3A] text-white'
                      : 'border-[#E8EAED] bg-white text-[#5A6573]'
                  }`}
                >
                  <UserCheck size={14} />
                  {item.with_operator ? 'With Operator' : 'Without Operator'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 3 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-[#0F1117]">Quote Summary</h3>
            <div className="mb-4 space-y-2 rounded-xl bg-[#D9DCE0] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5A6573]">Project</span>
                <span className="font-medium">{projectName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6573]">Location</span>
                <span className="font-medium">{projectLocation || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5A6573]">Dates</span>
                <span className="font-medium">
                  {startDate && endDate ? `${startDate} → ${endDate}` : '—'}
                </span>
              </div>
            </div>
            <div className="mb-4 space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.equipment_id} className="flex justify-between">
                  <span>
                    {item.model_name} × {item.qty} × {item.days}d{item.with_operator ? ' + Op' : ''}
                  </span>
                  <span className="font-medium">
                    SAR {(item.daily_rate_sar * item.qty * item.days).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-[#E8EAED] pt-4 text-sm">
              <div className="flex justify-between text-[#5A6573]">
                <span>Subtotal</span>
                <span>SAR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#5A6573]">
                <span>VAT (15%)</span>
                <span>SAR {vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#0E1F3A]">
                <span>Total</span>
                <span>SAR {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 4 && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-[#0F1117]">Ready to Submit</h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-[#5A6573]">
              Your quote will be sent to our team. We'll respond within 24 hours with a confirmed
              breakdown.
            </p>
            <p className="mb-8 text-2xl font-bold text-[#0E1F3A]">SAR {total.toLocaleString()}</p>
            <button
              onClick={submitQuote}
              disabled={submitting || items.length === 0}
              className="mx-auto flex items-center gap-2 rounded-xl bg-[#E8B339] px-8 py-3 font-bold text-[#0E1F3A] transition-colors hover:bg-[#F2C75B] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} /> Submit Quote
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between border-t border-[#E8EAED] pt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 rounded-xl border border-[#E8EAED] px-4 py-2 text-sm font-medium text-[#5A6573] transition-colors hover:bg-[#D9DCE0] disabled:opacity-30"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && items.length === 0}
              className="flex items-center gap-2 rounded-xl bg-[#0E1F3A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1628] disabled:opacity-30"
            >
              Next <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#0F1117]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E8EAED] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
      />
    </div>
  );
}
