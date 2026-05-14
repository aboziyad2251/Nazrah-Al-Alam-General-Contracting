import React from 'react';

import { GoldUnderline } from './GoldUnderline';

export interface SectionHeaderProps {
  /** Eyebrow label (small text above the title) */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center' | 'end';
  /** Whether the title gets the gold underline treatment */
  underline?: boolean;
  /** Light variant for dark backgrounds */
  light?: boolean;
  className?: string;
}

const alignMap = {
  start: 'items-start text-start',
  center: 'items-center text-center',
  end: 'items-end text-end',
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  underline = true,
  light = false,
  className = '',
}) => (
  <div className={['flex flex-col gap-3', alignMap[align], className].filter(Boolean).join(' ')}>
    {eyebrow && (
      <p
        className={[
          'font-poppins text-xs font-semibold uppercase tracking-[0.2em]',
          light ? 'text-gold' : 'text-gold',
        ].join(' ')}
      >
        {eyebrow}
      </p>
    )}

    <h2
      className={[
        'font-poppins text-3xl font-bold leading-tight md:text-4xl lg:text-5xl',
        light ? 'text-white' : 'text-navy',
      ].join(' ')}
    >
      {underline ? <GoldUnderline>{title}</GoldUnderline> : title}
    </h2>

    {subtitle && (
      <p
        className={[
          'max-w-2xl text-base leading-relaxed md:text-lg',
          light ? 'text-cloud' : 'text-ink-500',
        ].join(' ')}
      >
        {subtitle}
      </p>
    )}
  </div>
);

SectionHeader.displayName = 'SectionHeader';
