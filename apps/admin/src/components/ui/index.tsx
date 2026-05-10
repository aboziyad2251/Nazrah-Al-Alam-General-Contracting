import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ── KPI Card ────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  color?: 'navy' | 'gold' | 'green' | 'red';
}
export function KpiCard({ label, value, icon, trend, color = 'navy' }: KpiCardProps) {
  const colorMap = {
    navy: 'bg-navy text-white',
    gold: 'bg-gold/10 text-gold',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="rounded-xl border border-stone/50 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div
          className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorMap[color])}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend >= 0 ? 'text-green-600' : 'text-red-500'
            )}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  rented: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  retired: 'bg-gray-100 text-gray-500',
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-orange-100 text-orange-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-600',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-600',
  new: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-indigo-100 text-indigo-700',
  proposal: 'bg-purple-100 text-purple-700',
  negotiation: 'bg-orange-100 text-orange-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 text-ink-500/40">{icon}</div>
      <p className="text-ink-700 font-semibold">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-stone/80', className)} />;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-stone/50 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

// ── Modal (simple Radix Dialog wrapper) ───────────────────────────────────────
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl',
            width
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-bold text-ink-900">{title}</Dialog.Title>
            <button onClick={onClose} className="rounded-lg p-1 text-ink-500 hover:bg-stone">
              <X size={16} />
            </button>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Drawer (right-side panel) ─────────────────────────────────────────────────
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-stone px-6 py-4">
            <Dialog.Title className="font-bold text-ink-900">{title}</Dialog.Title>
            <button onClick={onClose} className="rounded-lg p-1 text-ink-500 hover:bg-stone">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Btn ────────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const v = {
    primary: 'bg-navy text-white hover:bg-navy-light',
    secondary: 'bg-stone text-ink-900 hover:bg-cloud',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-ink-500 hover:bg-stone',
  }[variant];
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        v,
        s,
        className
      )}
    >
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────────
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-cloud px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500/60 focus:outline-none focus:ring-2 focus:ring-navy/30',
        className
      )}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full resize-none rounded-lg border border-cloud px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500/60 focus:outline-none focus:ring-2 focus:ring-navy/30',
        className
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-ink-700 mb-1 block text-xs font-semibold">
      {children}
    </label>
  );
}

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
