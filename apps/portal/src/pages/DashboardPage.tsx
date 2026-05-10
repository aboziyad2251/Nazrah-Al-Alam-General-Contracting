import { getTranslations } from '@nazrah/i18n';
import type { Locale } from '@nazrah/types';
import { SectionHeader, Card } from '@nazrah/ui';

interface DashboardPageProps {
  locale: Locale;
}

export function DashboardPage({ locale }: DashboardPageProps) {
  const t = getTranslations(locale);

  const stats = [
    { label: t.about.projectsCompleted, value: '47', change: '+3', positive: true },
    { label: t.about.happyClients, value: '120', change: '+8', positive: true },
    { label: t.about.teamMembers, value: '1,240', change: '-2', positive: false },
    {
      label: locale === 'ar' ? 'قيمة العقود (مليون ريال)' : 'Contract Value (M SAR)',
      value: '840',
      change: '+12%',
      positive: true,
    },
  ];

  return (
    <div className="p-8">
      <SectionHeader
        eyebrow={locale === 'ar' ? 'البوابة الإدارية' : 'Admin Portal'}
        title={locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        align="start"
        underline={false}
        className="mb-8"
      />

      {/* Stats grid */}
      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, positive }) => (
          <Card key={label} variant="elevated" padding="md">
            <p className="font-poppins text-sm font-medium text-ink-500">{label}</p>
            <p className="mt-2 font-poppins text-3xl font-bold text-navy">{value}</p>
            <p
              className={[
                'mt-1 text-xs font-medium',
                positive ? 'text-emerald-600' : 'text-red-500',
              ].join(' ')}
            >
              {change} {locale === 'ar' ? 'هذا الشهر' : 'this month'}
            </p>
          </Card>
        ))}
      </div>

      <Card variant="bordered" padding="lg">
        <p className="font-poppins text-sm text-ink-500">
          {locale === 'ar'
            ? 'اختر قسمًا من القائمة الجانبية لبدء إدارة المحتوى.'
            : 'Select a section from the sidebar to start managing content.'}
        </p>
      </Card>
    </div>
  );
}
