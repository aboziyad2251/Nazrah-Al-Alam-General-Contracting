import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function CTABanner({ locale }: { locale: string }) {
  const t = await getTranslations('home.cta');

  return (
    <section className="relative overflow-hidden bg-gold py-20">
      {/* Chevron watermark */}
      <div
        className="pointer-events-none absolute -end-20 top-1/2 -translate-y-1/2 opacity-10"
        aria-hidden="true"
      >
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
          <path
            d="M80 40L320 200L80 360"
            stroke="#0E1F3A"
            strokeWidth="60"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="container-section relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
        <div>
          <h2 className="font-poppins text-3xl font-extrabold text-navy md:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-3 text-lg text-navy/75">{t('subtitle')}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-4">
          <Link
            href={`/${locale}/quote`}
            className="rounded-xl bg-navy px-8 py-4 font-poppins font-bold text-white transition-colors hover:bg-navy-deep"
          >
            {t('button')}
          </Link>
          <a
            href="tel:+966599810888"
            className="rounded-xl border-2 border-navy px-8 py-4 font-poppins font-bold text-navy transition-all hover:bg-navy hover:text-white"
          >
            {t('buttonSecondary')}
          </a>
        </div>
      </div>
    </section>
  );
}
