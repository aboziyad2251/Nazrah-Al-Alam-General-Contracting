// Skeleton loader
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/60 ${className}`} />;
}

// KPI Card
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}
export function KpiCard({ label, value, icon, trend, color = 'bg-navy' }: KpiCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-stone bg-white p-5 shadow-sm">
      <div
        className={`${color} flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-ink-900">{value}</p>
        {trend && <p className="mt-1 text-xs text-emerald-500">{trend}</p>}
      </div>
    </div>
  );
}

// Status Badge
const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  available: 'bg-emerald-100 text-emerald-700',
  rented: 'bg-orange-100 text-orange-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  issued: 'bg-blue-100 text-blue-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

// Empty state
export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cloud text-ink-500">
        {icon ?? '📭'}
      </div>
      <p className="text-lg font-semibold text-ink-900">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-ink-500">{subtitle}</p>}
    </div>
  );
}

// Page header
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
