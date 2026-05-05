import { toggleLocale } from '@nazrah/i18n';
import type { Locale } from '@nazrah/types';
import React from 'react';

export interface LangSwitcherProps {
  currentLocale: Locale;
  onSwitch: (next: Locale) => void;
  /** Compact mode shows only the two-letter code */
  compact?: boolean;
  className?: string;
}

const labels: Record<Locale, { native: string; code: string }> = {
  en: { native: 'English', code: 'EN' },
  ar: { native: 'العربية', code: 'ع' },
};

export const LangSwitcher: React.FC<LangSwitcherProps> = ({
  currentLocale,
  onSwitch,
  compact = false,
  className = '',
}) => {
  const next = toggleLocale(currentLocale);
  const nextLabel = labels[next];

  return (
    <button
      onClick={() => onSwitch(next)}
      className={[
        'inline-flex items-center gap-2 rounded-full',
        'border border-current px-3 py-1',
        'font-poppins text-sm font-medium',
        'transition-all duration-200',
        'hover:border-gold hover:bg-gold hover:text-navy',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`Switch to ${nextLabel.native}`}
      lang={next}
    >
      {/* Globe icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="8" cy="8" rx="3" ry="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1 8h14M8 1v14" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      {compact ? <span>{nextLabel.code}</span> : <span>{nextLabel.native}</span>}
    </button>
  );
};

LangSwitcher.displayName = 'LangSwitcher';
