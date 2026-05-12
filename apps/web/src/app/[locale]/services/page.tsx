import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SERVICES } from '@/data/services';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { CTABanner } from '@/components/sections/CTABanner';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  return { title: t('title') };
}

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  const tc = await getTranslations({ locale, namespace: 'common' });
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
        <div className="container-section space-y-10">
          {SERVICES.map((svc, i) => (
            <AnimatedSection key={svc.id} delay={i * 0.06} id={svc.slug}>
              <div className="border-navy/8 grid gap-8 rounded-3xl border-2 bg-white p-8 shadow-sm transition-colors hover:border-gold/30 lg:grid-cols-2">
                <div>
                  <div className="relative mb-5 h-14 w-14 overflow-hidden rounded-2xl shadow-sm">
                    <Image
                      src={svc.iconImage}
                      alt={isAr ? svc.nameAr : svc.nameEn}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <h2 className="mb-3 font-poppins text-2xl font-bold text-navy">
                    {isAr ? svc.nameAr : svc.nameEn}
                  </h2>
                  <p className="leading-relaxed text-ink-500">
                    {isAr ? svc.descriptionAr : svc.descriptionEn}
                  </p>
                  <Link
                    href={`/${locale}/quote`}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-poppins text-sm font-bold text-navy transition-colors hover:bg-gold-soft"
                  >
                    {tc('requestQuote')}
                  </Link>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-full rounded-2xl border border-gold/20 bg-navy/5 p-8 text-center">
                    <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-2xl shadow-md">
                      <Image
                        src={svc.iconImage}
                        alt={isAr ? svc.nameAr : svc.nameEn}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <p className="font-poppins font-bold text-navy">
                      {isAr ? svc.nameAr : svc.nameEn}
                    </p>
                    <p className="mt-2 font-poppins text-xs font-semibold uppercase tracking-widest text-gold">
                      {t('caseStudy')} →
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <CTABanner locale={locale} />
    </>
  );
}
