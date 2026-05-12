import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { routing } from '@/i18n/routing';
import { inter, poppins, ibmPlexArabic, cairo } from '@/lib/fonts';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import '@/app/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nazrahalalam.com'),
  title: { default: 'Nazrah Al Alam General Contracting', template: '%s | Nazrah Al Alam' },
  description:
    'Leading general contracting firm in Saudi Arabia — civil, mechanical, electrical, and infrastructure projects.',
  openGraph: {
    type: 'website',
    siteName: 'Nazrah Al Alam General Contracting',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={[inter.variable, poppins.variable, ibmPlexArabic.variable, cairo.variable].join(
        ' '
      )}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'Nazrah Al Alam General Contracting',
              url: 'https://nazrahalalam.com',
              telephone: '+966599810888',
              email: 'Nazaralalam@gmail.com',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Al Aqsa Business Park',
                addressLocality: 'Jeddah',
                addressCountry: 'SA',
              },
              description: 'Leading general contracting firm in Saudi Arabia.',
            }),
          }}
        />
      </head>
      <body className="bg-cloud text-ink-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-gold focus:px-4 focus:py-2 focus:font-poppins focus:text-sm focus:font-bold focus:text-navy"
          >
            {locale === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}
          </a>
          <Navbar locale={locale} />
          <main id="main-content">{children}</main>
          <Footer locale={locale} />
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
