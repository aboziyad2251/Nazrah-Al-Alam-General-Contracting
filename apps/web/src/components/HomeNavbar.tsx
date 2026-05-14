'use client';

import React, { useState } from 'react';

import type { Locale } from '@nazrah/types';
import { toggleLocale, getTranslations } from '@nazrah/i18n';
import { BrandLogo, Button, LangSwitcher } from '@nazrah/ui';

interface HomeNavbarProps {
  locale: Locale;
  t: {
    home: string;
    services: string;
    projects: string;
    equipment: string;
    contact: string;
    getQuote: string;
  };
}

export function HomeNavbar({ locale: initialLocale, t }: HomeNavbarProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  const handleLangSwitch = (next: Locale) => {
    setLocale(next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
  };

  const navT = locale === initialLocale ? t : getTranslations(locale).nav;

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md">
      <div className="container-section flex h-16 items-center justify-between">
        <BrandLogo theme="dark" size="sm" />
        <div className="hidden items-center gap-8 md:flex">
          {(['home', 'services', 'projects', 'equipment', 'contact'] as const).map((key) => (
            <a
              key={key}
              href={`#${key}`}
              className="font-poppins text-sm font-medium text-cloud/80 transition-colors hover:text-gold"
            >
              {navT[key]}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher
            currentLocale={locale}
            onSwitch={handleLangSwitch}
            compact
            className="border-white/30 text-white"
          />
          <Button variant="gold" size="sm">
            {navT.getQuote}
          </Button>
        </div>
      </div>
    </nav>
  );
}
