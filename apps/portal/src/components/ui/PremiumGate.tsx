import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface PremiumGateProps {
  children: React.ReactNode;
  locale?: string;
  compact?: boolean;
}

export function PremiumGate({ children, locale = 'en', compact = false }: PremiumGateProps) {
  const { isPremium } = useAuth();
  if (isPremium) return <>{children}</>;

  if (compact) {
    return (
      <div className="flex min-h-[6.5rem] items-center justify-center rounded-2xl border border-[#E8B339]/40 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0E1F3A]">
            <Lock size={14} className="text-[#E8B339]" />
          </div>
          <p className="text-xs font-semibold text-[#5A6573]">
            {locale === 'ar' ? 'للأعضاء المميزين' : 'Premium Only'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E8B339]/30 bg-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0E1F3A]">
        <Lock size={22} className="text-[#E8B339]" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#0F1117]">
        {locale === 'ar' ? 'تحليلات مالية متقدمة' : 'Advanced Financial Analytics'}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#5A6573]">
        {locale === 'ar'
          ? 'احصل على رؤى مالية معمّقة وتقارير الإنفاق مع العضوية المميزة'
          : 'Get detailed spending insights and financial reports with Premium membership'}
      </p>
      <Link
        to="/settings"
        className="mt-5 inline-block rounded-xl bg-[#E8B339] px-6 py-2.5 text-sm font-bold text-[#0E1F3A] transition-colors hover:bg-[#F2C75B]"
      >
        {locale === 'ar' ? 'الترقية إلى المميز' : 'Upgrade to Premium'}
      </Link>
    </div>
  );
}
