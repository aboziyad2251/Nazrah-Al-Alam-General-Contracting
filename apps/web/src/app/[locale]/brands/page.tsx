import { getTranslations } from 'next-intl/server';
import { BRANDS } from '@/data/brands';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { CTABanner } from '@/components/sections/CTABanner';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brands' });
  return { title: t('title') };
}

export default async function BrandsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brands' });
  const isAr = locale === 'ar';

  return (
    <>
      <div className="bg-navy pb-20 pt-32">
        <div className="container-section">
          <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.25em] text-gold">
            {t('eyebrow')}
          </p>
          <h1 className="font-poppins text-4xl font-extrabold text-white md:text-5xl">
            {t('title')}
            <span className="mt-3 block h-1.5 w-16 rounded-full bg-gold" />
          </h1>
          <p className="mt-4 max-w-xl text-cloud/70">{t('subtitle')}</p>
        </div>
      </div>

      <section className="section-padding bg-cloud">
        <div className="container-section grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {BRANDS.map((brand, i) => (
            <AnimatedSection key={brand.id} delay={i * 0.05}>
              <div className="border-navy/8 flex h-full flex-col items-center justify-center gap-3 rounded-2xl border-2 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-gold-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-navy/5 p-2 text-center font-poppins text-xs font-bold leading-tight text-navy">
                  {brand.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="font-poppins text-sm font-bold text-navy">{brand.name}</h2>
                <p className="text-center text-xs leading-relaxed text-ink-500">
                  {isAr ? brand.blurbAr : brand.blurbEn}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <CTABanner locale={locale} />
    </>
  );
}
