import { locales, defaultLocale } from '@nazrah/i18n';
import type { Locale } from '@nazrah/types';
import type { Metadata } from 'next';

import { inter, poppins, ibmPlexArabic, cairo } from '@/lib/fonts';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nazrahalalam.com'),
  title: {
    default: 'Nazrah Al Alam General Contracting | نظرة العالم للمقاولات',
    template: '%s | Nazrah Al Alam',
  },
  description:
    'Leading general contracting firm in Saudi Arabia specializing in civil, mechanical, and electrical projects.',
  keywords: ['contracting', 'Saudi Arabia', 'civil engineering', 'construction', 'مقاولات'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ar_SA',
    siteName: 'Nazrah Al Alam General Contracting',
  },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: { locale?: Locale };
}

export default function RootLayout({ children, params }: RootLayoutProps) {
  const locale: Locale = (params?.locale as Locale) ?? defaultLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={[inter.variable, poppins.variable, ibmPlexArabic.variable, cairo.variable].join(
        ' '
      )}
    >
      <body className="bg-white text-ink-900 antialiased">{children}</body>
    </html>
  );
}
