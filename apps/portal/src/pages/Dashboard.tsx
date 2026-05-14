import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { KpiCard, Skeleton, PageHeader, StatusBadge, EmptyState } from '@/components/ui';
import { Package, FileText, Receipt, DollarSign, Bot, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

function useClientId() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['client-id', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', user!.id)
        .single();
      return data?.id as number | null;
    },
  });
}

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const { locale } = useUIStore();
  const { data: clientId } = useClientId();

  const { data: kpi, isLoading } = useQuery({
    queryKey: ['dashboard-kpi', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const [bookings, quotes, invoices] = await Promise.all([
        supabase
          .from('bookings')
          .select('id', { count: 'exact' })
          .eq('client_id', clientId!)
          .in('status', ['confirmed', 'in_progress']),
        supabase
          .from('quotes')
          .select('id', { count: 'exact' })
          .eq('client_id', clientId!)
          .in('status', ['draft', 'sent']),
        supabase
          .from('invoices')
          .select('total_sar')
          .eq('client_id', clientId!)
          .eq('status', 'issued'),
      ]);
      const outstanding = invoices.data?.reduce((s, i) => s + Number(i.total_sar), 0) ?? 0;
      return { activeRentals: bookings.count ?? 0, openQuotes: quotes.count ?? 0, outstanding };
    },
    staleTime: 30_000,
  });

  const { data: recentQuotes } = useQuery({
    queryKey: ['recent-quotes', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select('id,status,project_name,total_sar,created_at')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const greeting =
    locale === 'ar'
      ? `مرحباً، ${profile?.full_name_ar ?? profile?.full_name ?? ''}`
      : `Welcome back, ${profile?.full_name ?? 'Client'}`;

  return (
    <div>
      <PageHeader
        title={greeting}
        subtitle={
          locale === 'ar' ? 'إليك ملخص نشاطك اليوم.' : "Here's your activity summary for today."
        }
        action={
          <Link
            to="/assistant"
            className="flex items-center gap-2 rounded-xl bg-[#0E1F3A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0A1628]"
          >
            <Bot size={16} />
            {locale === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              label={locale === 'ar' ? 'إيجارات نشطة' : 'Active Rentals'}
              value={kpi?.activeRentals ?? 0}
              icon={<Package size={20} />}
              color="bg-[#0E1F3A]"
            />
            <KpiCard
              label={locale === 'ar' ? 'عروض مفتوحة' : 'Open Quotes'}
              value={kpi?.openQuotes ?? 0}
              icon={<FileText size={20} />}
              color="bg-blue-600"
            />
            <KpiCard
              label={locale === 'ar' ? 'فواتير مستحقة' : 'Outstanding Invoices'}
              value={`SAR ${(kpi?.outstanding ?? 0).toLocaleString()}`}
              icon={<Receipt size={20} />}
              color="bg-orange-500"
            />
            <KpiCard
              label={locale === 'ar' ? 'إجمالي الإنفاق' : 'Total Spent YTD'}
              value="SAR —"
              icon={<DollarSign size={20} />}
              color="bg-emerald-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Quotes */}
        <div className="rounded-2xl border border-[#E8EAED] bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[#0F1117]">
              {locale === 'ar' ? 'آخر العروض' : 'Recent Quotes'}
            </h3>
            <Link
              to="/quotes"
              className="flex items-center gap-1 text-sm text-[#0E1F3A] transition-all hover:gap-2"
            >
              {locale === 'ar' ? 'عرض الكل' : 'View all'} <ArrowRight size={14} />
            </Link>
          </div>
          {!recentQuotes?.length ? (
            <EmptyState
              title="No quotes yet"
              subtitle="Create your first quote using the Quote Builder"
            />
          ) : (
            <div className="divide-y divide-[#E8EAED]">
              {recentQuotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#0F1117]">
                      {q.project_name ?? `Quote #${q.id}`}
                    </p>
                    <p className="mt-0.5 text-xs text-[#5A6573]">
                      {formatDistanceToNow(new Date(q.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-[#0F1117]">
                      SAR {Number(q.total_sar).toLocaleString()}
                    </span>
                    <StatusBadge status={q.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Assistant CTA */}
        <div className="flex flex-col justify-between rounded-2xl bg-[#0E1F3A] p-6 text-white">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8B339]">
              <Bot size={20} className="text-[#0E1F3A]" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {locale === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
            </h3>
            <p className="text-sm text-white/60">
              {locale === 'ar'
                ? 'اسأل المساعد عن المعدات المناسبة أو تحليل موقعك.'
                : 'Ask about equipment recommendations, project scoping, or site analysis.'}
            </p>
          </div>
          <Link
            to="/assistant"
            className="mt-6 rounded-xl bg-[#E8B339] py-2.5 text-center text-sm font-semibold text-[#0E1F3A] transition-colors hover:bg-[#F2C75B]"
          >
            {locale === 'ar' ? 'ابدأ المحادثة' : 'Start Chatting'}
          </Link>
        </div>
      </div>
    </div>
  );
}
