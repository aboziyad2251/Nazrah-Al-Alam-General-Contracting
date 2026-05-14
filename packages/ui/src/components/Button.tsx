'use client';

import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: 'button' | 'a';
  href?: string;
  children: React.ReactNode;
}

// ─── Variant & size maps ──────────────────────────────────────────────────────
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-navy text-white hover:bg-navy-deep focus-visible:ring-navy/40 shadow-navy-md hover:shadow-lg',
  secondary: 'bg-ink-900 text-white hover:bg-ink-900/90 focus-visible:ring-ink-900/40',
  outline:
    'border-2 border-navy text-navy bg-transparent hover:bg-navy hover:text-white focus-visible:ring-navy/40',
  ghost: 'text-navy bg-transparent hover:bg-navy/8 focus-visible:ring-navy/30',
  gold: 'bg-gold text-navy font-semibold hover:bg-gold-soft shadow-gold-sm hover:shadow-gold-md focus-visible:ring-gold/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-base gap-2.5 rounded-xl',
  xl: 'h-14 px-9 text-lg gap-3 rounded-2xl',
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Button Component ─────────────────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      as: Tag = 'button',
      href,
      ...rest
    },
    ref
  ) => {
    const base = [
      'inline-flex items-center justify-center',
      'font-medium font-poppins tracking-wide',
      'transition-all duration-200 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const spinnerSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'xl' ? 'w-5 h-5' : 'w-4 h-4';

    const content = (
      <>
        {loading ? (
          <Spinner className={spinnerSize} />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        <span>{children}</span>
        {!loading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </>
    );

    if (Tag === 'a' && href) {
      return (
        <a href={href} className={base} aria-disabled={disabled}>
          {content}
        </a>
      );
    }

    return (
      <button ref={ref} className={base} disabled={disabled || loading} {...rest}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
