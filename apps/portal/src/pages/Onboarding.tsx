import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Loader2, CheckCircle } from 'lucide-react';

const steps = ['Company Info', 'Contact', 'Preferences'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, fetchProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    full_name_ar: '',
    company: '',
    vat_number: '',
    billing_address: '',
    phone: '',
    locale: 'en',
  });

  const patch = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const finish = async () => {
    // Resolve session directly from Supabase in case the store hasn't hydrated yet
    const resolvedUser = user ?? (await supabase.auth.getSession()).data.session?.user ?? null;
    if (!resolvedUser) {
      toast.error('Session expired — please log in again.');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const { error: pErr } = await supabase.from('profiles').upsert({
        id: resolvedUser.id,
        full_name: form.full_name,
        full_name_ar: form.full_name_ar,
        phone: form.phone,
        company: form.company,
        locale: form.locale,
      });
      if (pErr) throw new Error(`Profile: ${pErr.message}`);

      const { error: cErr } = await supabase.from('clients').upsert(
        {
          profile_id: resolvedUser.id,
          vat_number: form.vat_number || null,
          billing_address: form.billing_address || null,
        },
        { onConflict: 'profile_id' }
      );
      if (cErr) throw new Error(`Client record: ${cErr.message}`);

      await fetchProfile(resolvedUser.id);
      toast.success('Profile saved!');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Setup failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#D9DCE0] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[#E8EAED] bg-white p-8 shadow-sm">
        {/* Progress */}
        <div className="mb-8 flex gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${i <= step ? 'bg-[#0E1F3A]' : 'bg-[#E8EAED]'}`}
              />
              <p
                className={`mt-1 text-xs ${i === step ? 'font-medium text-[#0E1F3A]' : 'text-[#5A6573]'}`}
              >
                {s}
              </p>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F1117]">Company Information</h2>
            <Field
              label="Company Name (EN)"
              value={form.company}
              onChange={(v) => patch('company', v)}
            />
            <Field
              label="VAT Number"
              value={form.vat_number}
              onChange={(v) => patch('vat_number', v)}
              placeholder="3xxxxxxxxxxxxxxxxx"
            />
            <Field
              label="Billing Address"
              value={form.billing_address}
              onChange={(v) => patch('billing_address', v)}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F1117]">Primary Contact</h2>
            <Field
              label="Full Name (English)"
              value={form.full_name}
              onChange={(v) => patch('full_name', v)}
            />
            <Field
              label="الاسم الكامل (Arabic)"
              value={form.full_name_ar}
              onChange={(v) => patch('full_name_ar', v)}
              dir="rtl"
            />
            <Field
              label="Phone / WhatsApp"
              value={form.phone}
              onChange={(v) => patch('phone', v)}
              placeholder="+966 5x xxx xxxx"
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#0F1117]">Preferences</h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0F1117]">
                Preferred Language
              </label>
              <div className="flex gap-3">
                {[
                  ['en', 'English'],
                  ['ar', 'العربية'],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => patch('locale', v)}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                      form.locale === v
                        ? 'border-[#0E1F3A] bg-[#0E1F3A] text-white'
                        : 'border-[#E8EAED] text-[#5A6573]'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 rounded-xl bg-[#D9DCE0] p-4">
              <p className="text-sm text-[#5A6573]">
                You can change language and notification preferences anytime in Settings.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex-1 rounded-xl border border-[#E8EAED] py-3 text-sm font-medium text-[#5A6573] transition-colors hover:bg-[#D9DCE0]"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={step < 2 ? () => setStep(step + 1) : finish}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E1F3A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A1628] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : step < 2 ? (
              'Continue'
            ) : (
              <>
                <CheckCircle size={16} />
                <span>Complete Setup</span>
              </>
            )}
          </button>
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
  dir = 'ltr',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#0F1117]">{label}</label>
      <input
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E8EAED] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
      />
    </div>
  );
}
