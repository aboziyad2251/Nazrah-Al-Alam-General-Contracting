import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { EQUIPMENT_CATEGORIES } from '@/data/equipment';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { CTABanner } from '@/components/sections/CTABanner';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'equipment' });
  return { title: t('title') };
}

export default async function EquipmentPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'equipment' });
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
        <div className="container-section grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {EQUIPMENT_CATEGORIES.map((cat, i) => (
            <AnimatedSection key={cat.slug} delay={i * 0.07}>
              <Link href={`/${locale}/equipment/${cat.slug}`} className="group block">
                <div className="border-navy/8 h-full rounded-2xl border-2 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-navy-md">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-3xl transition-colors duration-200 group-hover:bg-gold">
                    <span>{cat.icon}</span>
                  </div>
                  <h2 className="mb-2 font-poppins text-lg font-bold text-navy">
                    {isAr ? cat.nameAr : cat.nameEn}
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed text-ink-500">
                    {isAr ? cat.descriptionAr : cat.descriptionEn}
                  </p>
                  <p className="font-poppins text-xs font-semibold text-gold">
                    {cat.models.length} {t('allModels')} →
                  </p>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

      <CTABanner locale={locale} />
    </>
  );
}
