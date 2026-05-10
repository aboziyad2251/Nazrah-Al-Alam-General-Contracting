import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { PageHeader } from '@/components/ui';
import { toast } from 'sonner';
import { Loader2, User, Globe, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuthStore();
  const { locale, setLocale } = useUIStore();
  const [saving, setSaving] = useState(false);
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
              Role:{' '}
              <span className="font-medium capitalize text-[#0F1117]">{profile?.role ?? '—'}</span>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#E8EAED] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
      />
    </div>
  );
}
