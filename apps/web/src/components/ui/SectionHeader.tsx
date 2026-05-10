import React from 'react';
import { AnimatedSection } from './AnimatedSection';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  light?: boolean;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  light = false,
  className = '',
}: SectionHeaderProps) {
  const alignCls = align === 'center' ? 'items-center text-center' : 'items-start text-start';

  return (
    <AnimatedSection className={`flex flex-col gap-3 ${alignCls} ${className}`}>
      {eyebrow && (
        <div className="flex items-center gap-2">
          {align === 'start' && (
            /* Navy chevron signature element */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M7 4L13 10L7 16"
                stroke="#0E1F3A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <p className="font-poppins text-xs font-bold uppercase tracking-[0.22em] text-gold">
            {eyebrow}
          </p>
          {align === 'center' && (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M7 4L13 10L7 16"
                stroke="#E8B339"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}
      <h2
        className={`font-poppins text-3xl font-bold leading-tight md:text-4xl lg:text-5xl ${light ? 'text-white' : 'text-navy'}`}
      >
        {title}
        {/* Gold underline bar */}
        <span className="mt-2 block h-1 w-14 rounded-full bg-gold" aria-hidden="true" />
      </h2>
      {subtitle && (
        <p
          className={`max-w-2xl text-base leading-relaxed md:text-lg ${light ? 'text-cloud/80' : 'text-ink-500'}`}
        >
          {subtitle}
        </p>
      )}
    </AnimatedSection>
  );
}
