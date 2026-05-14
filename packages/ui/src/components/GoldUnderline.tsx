import React from 'react';

export interface GoldUnderlineProps {
  children: React.ReactNode;
  /** Width of underline as Tailwind width class (default: w-12) */
  lineWidth?: string;
  /** Thickness in px */
  thickness?: number;
  className?: string;
}

/** Decorative gold bar underline typically used below section headings. */
export const GoldUnderline: React.FC<GoldUnderlineProps> = ({
  children,
  lineWidth = 'w-12',
  thickness = 3,
  className = '',
}) => (
  <span className={['relative inline-block', className].filter(Boolean).join(' ')}>
    {children}
    <span
      className={['mt-1 block rounded-full bg-gold', lineWidth].join(' ')}
      style={{ height: thickness }}
      aria-hidden="true"
    />
  </span>
);

GoldUnderline.displayName = 'GoldUnderline';
