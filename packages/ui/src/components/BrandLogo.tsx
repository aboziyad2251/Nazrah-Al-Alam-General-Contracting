import React from 'react';

export interface BrandLogoProps {
  /** 'full' shows icon + wordmark; 'icon' shows only the hex mark */
  variant?: 'full' | 'icon';
  /** 'dark' = white text (for dark backgrounds); 'light' = navy text */
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { mark: 28, text: 'text-sm' },
  md: { mark: 36, text: 'text-base' },
  lg: { mark: 48, text: 'text-xl' },
};

/**
 * BrandLogo – SVG hexagonal brand mark + bilingual wordmark.
 * The hex is always gold; the wordmark colour follows `theme`.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  className = '',
}) => {
  const { mark, text } = sizeMap[size];
  const textColor = theme === 'dark' ? 'text-white' : 'text-navy';

  const HexMark = (
    <svg
      width={mark}
      height={mark}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer hex – gold */}
      <polygon points="18,1 33,9 33,27 18,35 3,27 3,9" fill="#E8B339" />
      {/* Inner hex – navy */}
      <polygon points="18,7 28,13 28,23 18,29 8,23 8,13" fill="#0E1F3A" />
      {/* N glyph */}
      <path
        d="M13 22V14l10 8V14"
        stroke="#E8B339"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <span className={['inline-flex', className].join(' ')} aria-label="Nazrah Al Alam logo">
        {HexMark}
      </span>
    );
  }

  return (
    <span
      className={['inline-flex items-center gap-2.5', className].join(' ')}
      aria-label="Nazrah Al Alam General Contracting"
    >
      {HexMark}
      <span className={['flex flex-col leading-none', textColor].join(' ')}>
        <span className={['font-poppins font-bold tracking-tight', text].join(' ')}>
          Nazrah Al Alam
        </span>
        <span className="mt-0.5 font-poppins text-[0.6em] uppercase tracking-[0.12em] opacity-70">
          General Contracting
        </span>
      </span>
    </span>
  );
};

BrandLogo.displayName = 'BrandLogo';
