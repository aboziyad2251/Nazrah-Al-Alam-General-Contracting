import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SERVICES } from '@/data/services';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

export async function ServicesGrid({ locale }: { locale: string }) {
  const t = await getTranslations('home.services');
  const tc = await getTranslations('common');
  const isAr = locale === 'ar';

  return (
    <section className="section-padding bg-white" id="services">
      <div className="container-section">
        <SectionHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SERVICES.map((svc, i) => (
            <AnimatedSection key={svc.id} delay={i * 0.07}>
              <div className="border-navy/8 group flex h-full flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-navy-md">
                <div className="mb-4 h-14 w-14 overflow-hidden rounded-xl shadow-sm">
                  <img
                    src={svc.iconImage}
                    alt={isAr ? svc.nameAr : svc.nameEn}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h3 className="mb-2 font-poppins text-base font-bold text-navy">
                  {isAr ? svc.nameAr : svc.nameEn}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-ink-500">
                  {isAr ? svc.descriptionAr : svc.descriptionEn}
                </p>
                <Link
                  href={`/${locale}/services#${svc.slug}`}
                  className="mt-4 inline-flex items-center gap-1 font-poppins text-sm font-semibold text-gold transition-all hover:gap-2"
                >
                  {tc('learnMore')}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="rtl:rotate-180"
                  >
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
