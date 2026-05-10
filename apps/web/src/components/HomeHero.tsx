'use client';

import React from 'react';

import type { Locale } from '@nazrah/types';
import { BrandLogo, Button, ChevronArrow } from '@nazrah/ui';

interface HomeHeroProps {
  locale: Locale;
  t: {
    tagline: string;
    subtitle: string;
    cta: string;
    ctaSecondary: string;
  };
}

export function HomeHero({ locale, t }: HomeHeroProps) {
  const isRTL = locale === 'ar';

  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #E8B339 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />
      {/* Gold accent blob */}
      <div
        className="absolute -top-40 end-0 h-[600px] w-[600px] rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-section relative z-10 py-32 text-center lg:text-start">
        <p className="mb-4 animate-fade-in font-poppins text-xs font-semibold uppercase tracking-[0.3em] text-gold">
          {locale === 'ar' ? 'منذ عام 1999' : 'Est. 1999 · Saudi Arabia'}
        </p>
        <h1 className="mb-6 animate-slide-up font-poppins text-5xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl">
          {t.tagline}
        </h1>
        <p className="mx-auto mb-10 max-w-2xl animate-fade-in text-lg leading-relaxed text-cloud/80 lg:mx-0">
          {t.subtitle}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
          <Button
            variant="gold"
            size="lg"
            rightIcon={<ChevronArrow size={18} colorClass="text-navy" />}
          >
            {t.cta}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="!border-white/30 !text-white hover:!border-gold hover:!bg-transparent hover:!text-gold"
          >
            {t.ctaSecondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
