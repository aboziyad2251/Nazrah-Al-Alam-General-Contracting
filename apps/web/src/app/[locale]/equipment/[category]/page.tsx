import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { EQUIPMENT_CATEGORIES } from '@/data/equipment';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { CTABanner } from '@/components/sections/CTABanner';
import { routing } from '@/i18n/routing';

interface Props {
  params: Promise<{ locale: string; category: string }>;
}

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    EQUIPMENT_CATEGORIES.map((cat) => ({ locale, category: cat.slug }))
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale, category } = await params;
  const cat = EQUIPMENT_CATEGORIES.find((c) => c.slug === category);
  if (!cat) return { title: 'Not Found' };
  return { title: locale === 'ar' ? cat.nameAr : cat.nameEn };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category } = await params;
  const cat = EQUIPMENT_CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

  const t = await getTranslations({ locale, namespace: 'equipment' });
  const isAr = locale === 'ar';

  return (
    <>
      {/* Header */}
      <div className="bg-navy pb-20 pt-32">
        <div className="container-section">
          <Link
            href={`/${locale}/equipment`}
            className="mb-6 inline-flex items-center gap-2 font-poppins text-sm font-semibold text-gold hover:text-gold-soft rtl:flex-row-reverse"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:rotate-180">
              <path
                d="M13 8H3M7 4L3 8l4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('backToHub')}
          </Link>
          <div className="mb-4 flex items-center gap-4">
            <span className="text-4xl">{cat.icon}</span>
            <div>
              <h1 className="font-poppins text-4xl font-extrabold text-white md:text-5xl">
                {isAr ? cat.nameAr : cat.nameEn}
                <span className="mt-2 block h-1.5 w-14 rounded-full bg-gold" />
              </h1>
            </div>
          </div>
          <p className="max-w-xl text-cloud/70">{isAr ? cat.descriptionAr : cat.descriptionEn}</p>
        </div>
      </div>

      {/* Models grid */}
      <section className="section-padding bg-cloud">
        <div className="container-section grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {cat.models.map((model, i) => (
            <AnimatedSection key={model.id} delay={i * 0.08}>
              <div className="border-navy/8 flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-navy-md">
                {/* Hex image */}
                <div className="flex items-center justify-center bg-navy/5 py-8">
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <defs>
                      <clipPath id={`hex-cat-${model.id}`}>
                        <polygon points="100,8 188,54 188,146 100,192 12,146 12,54" />
                      </clipPath>
                    </defs>
                    <polygon
                      points="100,8 188,54 188,146 100,192 12,146 12,54"
                      fill="none"
                      stroke="#E8B339"
                      strokeWidth="3"
                    />
                    <image
                      href={model.image}
                      x="0"
                      y="0"
                      width="200"
                      height="200"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#hex-cat-${model.id})`}
                    />
                  </svg>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="font-poppins text-xs font-medium uppercase tracking-wider text-ink-500">
                    {model.brand}
                  </p>
                  <h2 className="mt-1 font-poppins text-xl font-bold text-navy">
                    {isAr ? model.nameAr : model.nameEn}
                  </h2>

                  {/* Specs */}
                  <div className="mt-4 divide-y divide-cloud rounded-xl bg-stone">
                    {model.specs.map((spec) => (
                      <div key={spec.labelEn} className="flex justify-between px-4 py-2.5 text-sm">
                        <span className="text-ink-500">{isAr ? spec.labelAr : spec.labelEn}</span>
                        <span className="font-semibold text-navy">{spec.value}</span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs italic text-ink-500">{t('contactForAvail')}</p>

                  <Link
                    href={`/${locale}/quote`}
                    className="mt-auto block w-full rounded-xl bg-gold py-3 pt-5 text-center font-poppins font-bold text-navy transition-colors hover:bg-gold-soft"
                  >
                    {t('requestQuote')}
                  </Link>
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
