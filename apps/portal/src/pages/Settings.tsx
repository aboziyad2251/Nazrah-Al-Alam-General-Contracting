import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { PageHeader } from '@/components/ui';
import { toast } from 'sonner';
import { Loader2, User, Globe, Bell, Crown, Shield, Clock, CheckCircle, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuthStore();
  const { locale, setLocale } = useUIStore();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [upgradeMsg, setUpgradeMsg] = useState('');
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    full_name_ar: profile?.full_name_ar ?? '',
    phone: profile?.phone ?? '',
    company: profile?.company ?? '',
  });

  const patch = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, locale })
      .eq('id', user.id);
    if (error) toast.error(error.message);
    else {
      await fetchProfile(user.id);
      toast.success('Settings saved!');
    }
    setSaving(false);
  };

  // Upgrade request state
  const { data: upgradeRequest } = useQuery({
    queryKey: ['upgrade-request', user?.id],
    enabled: !!user && profile?.role === 'client',
    queryFn: async () => {
      const { data } = await supabase
        .from('upgrade_requests')
        .select('id, status, created_at')
        .eq('profile_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('upgrade_requests').insert({
        profile_id: user!.id,
        message: upgradeMsg.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Request submitted! Our team will review it shortly.');
      setUpgradeMsg('');
      qc.invalidateQueries({ queryKey: ['upgrade-request'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const role = profile?.role;
  const isPremium = role === 'premium_client' || role === 'admin' || role === 'super_admin';

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={locale === 'ar' ? 'الإعدادات' : 'Settings'} />

      <div className="space-y-4">
        {/* Profile */}
        <Section icon={<User size={16} />} title="Profile">
          <div className="space-y-4">
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
            />
            <Field label="Company" value={form.company} onChange={(v) => patch('company', v)} />
          </div>
        </Section>

        {/* Membership */}
        <Section icon={<Crown size={16} />} title={locale === 'ar' ? 'العضوية' : 'Membership'}>
          {role === 'premium_client' ? (
            <div className="flex items-center gap-3 rounded-xl bg-[#E8B339]/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8B339]">
                <Crown size={18} className="text-[#0E1F3A]" />
              </div>
              <div>
                <p className="font-semibold text-[#0F1117]">
                  {locale === 'ar' ? 'عضو مميز' : 'Premium Member'}
                </p>
                <p className="text-sm text-[#5A6573]">
                  {locale === 'ar'
                    ? 'لديك وصول كامل لجميع الميزات المميزة'
                    : 'You have full access to all premium features'}
                </p>
              </div>
            </div>
          ) : role === 'admin' || role === 'super_admin' ? (
            <div className="flex items-center gap-3 rounded-xl bg-[#0E1F3A]/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E1F3A]">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#0F1117]">
                  {locale === 'ar' ? 'مدير النظام' : 'Administrator'}
                </p>
                <p className="text-sm text-[#5A6573]">
                  {locale === 'ar' ? 'وصول كامل للنظام' : 'Full system access'}
                </p>
              </div>
            </div>
          ) : upgradeRequest?.status === 'pending' ? (
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <Clock size={18} className="mt-0.5 shrink-0 text-blue-500" />
              <div>
                <p className="font-medium text-blue-800">
                  {locale === 'ar' ? 'طلبك قيد المراجعة' : 'Request under review'}
                </p>
                <p className="mt-0.5 text-sm text-blue-600">
                  {locale === 'ar'
                    ? 'سيتواصل معك فريقنا قريباً'
                    : "Our team will get back to you shortly"}
                </p>
              </div>
            </div>
          ) : upgradeRequest?.status === 'rejected' ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {locale === 'ar'
                  ? 'لم تتم الموافقة على طلبك السابق. يمكنك تقديم طلب جديد.'
                  : 'Your previous request was not approved. You may submit a new one.'}
              </div>
              <UpgradeForm
                locale={locale}
                value={upgradeMsg}
                onChange={setUpgradeMsg}
                onSubmit={() => submitRequest.mutate()}
                loading={submitRequest.isPending}
              />
            </div>
          ) : (
            <UpgradeForm
              locale={locale}
              value={upgradeMsg}
              onChange={setUpgradeMsg}
              onSubmit={() => submitRequest.mutate()}
              loading={submitRequest.isPending}
            />
          )}
        </Section>

        {/* Language */}
        <Section icon={<Globe size={16} />} title="Language & Region">
          <div className="flex gap-3">
            {[
              ['en', 'English'],
              ['ar', 'العربية'],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setLocale(v as 'en' | 'ar')}
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  locale === v
                    ? 'border-[#0E1F3A] bg-[#0E1F3A] text-white'
                    : 'border-[#E8EAED] text-[#5A6573]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={<Bell size={16} />} title="Notifications">
          <div className="space-y-3">
            {[
              'Quote status updates',
              'Booking reminders',
              'Invoice due alerts',
              'Promotional offers',
            ].map((pref) => (
              <div key={pref} className="flex items-center justify-between">
                <span className="text-sm text-[#0F1117]">{pref}</span>
                <button className="relative h-6 w-11 rounded-full bg-[#0E1F3A] transition-colors">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Account */}
        <Section icon={<User size={16} />} title="Account">
          <div className="space-y-1 text-sm text-[#5A6573]">
            <p>
              Email: <span className="font-medium text-[#0F1117]">{user?.email ?? '—'}</span>
            </p>
            <p>
              Phone: <span className="font-medium text-[#0F1117]">{user?.phone ?? '—'}</span>
            </p>
            <p>
              Plan:{' '}
              <span
                className={`font-medium capitalize ${isPremium ? 'text-amber-600' : 'text-[#0F1117]'}`}
              >
                {role === 'premium_client'
                  ? 'Premium'
                  : role === 'admin' || role === 'super_admin'
                  ? 'Admin'
                  : 'Standard'}
              </span>
            </p>
            <p>
              Member since:{' '}
              <span className="font-medium text-[#0F1117]">
                {user?.created_at ? new Date(user.created_at).getFullYear() : '—'}
              </span>
            </p>
          </div>
        </Section>

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1F3A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A1628] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function UpgradeForm({
  locale,
  value,
  onChange,
  onSubmit,
  loading,
}: {
  locale: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#F8F9FA] p-4">
        <p className="mb-3 text-sm font-semibold text-[#0F1117]">
          {locale === 'ar' ? 'مزايا العضوية المميزة' : 'Premium membership includes'}
        </p>
        <ul className="space-y-2">
          {[
            locale === 'ar' ? 'تقارير مالية وتحليلات الإنفاق' : 'Financial analytics & spending reports',
            locale === 'ar' ? 'أولوية في حجز المعدات' : 'Priority equipment booking',
            locale === 'ar' ? 'مدير حساب مخصص' : 'Dedicated account manager',
            locale === 'ar' ? 'شروط دفع موسّعة' : 'Extended payment terms',
          ].map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-[#5A6573]">
              <Sparkles size={13} className="shrink-0 text-[#E8B339]" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[#0F1117]">
          {locale === 'ar' ? 'رسالة (اختياري)' : 'Message (optional)'}
        </label>
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            locale === 'ar'
              ? 'أخبرنا عن احتياجاتك أو مشاريعك…'
              : 'Tell us about your needs or upcoming projects…'
          }
          className="w-full resize-none rounded-xl border border-[#E8EAED] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8B339] py-2.5 text-sm font-bold text-[#0E1F3A] transition-colors hover:bg-[#F2C75B] disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            <Crown size={15} />
            {locale === 'ar' ? 'طلب ترقية للمميز' : 'Request Premium Upgrade'}
          </>
        )}
      </button>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E8EAED] bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="text-[#5A6573]">{icon}</div>
        <h2 className="font-semibold text-[#0F1117]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  dir = 'ltr',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#0F1117]">{label}</label>
      <input
        dir={dir}
        title={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#E8EAED] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
      />
    </div>
  );
}
