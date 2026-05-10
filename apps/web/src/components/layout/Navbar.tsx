'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BrandLogo } from '@nazrah/ui';

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const otherLocale = locale === 'en' ? 'ar' : 'en';
  // swap locale prefix in the path
  const altHref = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const links = [
    { key: 'about', href: `/${locale}/about` },
    { key: 'equipment', href: `/${locale}/equipment` },
    { key: 'services', href: `/${locale}/services` },
    { key: 'projects', href: `/${locale}/projects` },
    { key: 'brands', href: `/${locale}/brands` },
    { key: 'contact', href: `/${locale}/contact` },
  ] as const;

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'bg-navy/98 shadow-navy-md backdrop-blur-md' : 'bg-navy',
      ].join(' ')}
    >
      <div className="container-section flex h-16 items-center justify-between">
        <Link href={`/${locale}`}>
          <BrandLogo theme="dark" size="sm" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="font-poppins text-sm font-medium text-cloud/80 transition-colors hover:text-gold"
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Lang switcher */}
          <Link
            href={altHref}
            className="rounded-full border border-white/25 px-3 py-1 font-poppins text-xs font-semibold text-white transition-colors hover:border-gold hover:text-gold"
            hrefLang={otherLocale}
          >
            {locale === 'en' ? 'عربي' : 'EN'}
          </Link>

          {/* CTA */}
          <Link
            href={`/${locale}/quote`}
            className="hidden items-center gap-1.5 rounded-xl bg-gold px-4 py-2 font-poppins text-sm font-semibold text-navy transition-colors hover:bg-gold-soft sm:inline-flex"
          >
            {t('quote')}
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-white lg:hidden"
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {open ? (
                <path
                  d="M4 4L18 18M18 4L4 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <line
                    x1="3"
                    y1="6"
                    x2="19"
                    y2="6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="3"
                    y1="11"
                    x2="19"
                    y2="11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="3"
                    y1="16"
                    x2="19"
                    y2="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="space-y-2 border-t border-white/10 bg-navy px-4 py-4 lg:hidden">
          {links.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setOpen(false)}
              className="block py-2.5 font-poppins text-sm font-medium text-cloud/80 transition-colors hover:text-gold"
            >
              {t(key)}
            </Link>
          ))}
          <Link
            href={`/${locale}/quote`}
            onClick={() => setOpen(false)}
            className="mt-3 block rounded-xl bg-gold px-4 py-2.5 text-center font-poppins text-sm font-semibold text-navy"
          >
            {t('quote')}
          </Link>
        </div>
      )}
    </header>
  );
}
