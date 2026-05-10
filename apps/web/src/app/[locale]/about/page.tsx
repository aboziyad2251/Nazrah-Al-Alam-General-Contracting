import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { CTABanner } from '@/components/sections/CTABanner';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title'), description: t('subtitle') };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const isAr = locale === 'ar';

  const whyItems = t.raw('why.items') as { title: string; desc: string }[];
  const valueItems = t.raw('values.items') as string[];

  return (
    <>
      {/* Hero */}
      <div className="bg-navy pb-20 pt-32">
        <div className="container-section">
          <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.25em] text-gold">
            {t('eyebrow')}
          </p>
          <h1 className="max-w-3xl font-poppins text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl">
            {t('title')}
            <span className="mt-3 block h-1.5 w-16 rounded-full bg-gold" />
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cloud/70">{t('subtitle')}</p>
        </div>
      </div>

      {/* Founder */}
      <section className="section-padding bg-white">
        <div className="container-section grid items-center gap-14 lg:grid-cols-2">
          <AnimatedSection direction="left">
            <div className="relative">
              <div className="rounded-3xl border-2 border-gold/20 bg-navy/5 p-10">
                <p className="mb-3 font-poppins text-xs font-bold uppercase tracking-widest text-gold">
                  {t('founder.eyebrow')}
                </p>
                <h2 className="font-poppins text-2xl font-bold text-navy md:text-3xl">
                  {t('founder.title')}
                </h2>
                <p className="mt-1 font-poppins text-sm font-semibold text-gold">
                  {t('founder.role')}
                </p>
                <div className="mt-5 h-px bg-gold/30" />
                <p className="mt-5 text-base leading-relaxed text-ink-500">{t('founder.bio')}</p>
              </div>
              {/* Gold accent */}
              <div className="absolute -bottom-3 -end-3 -z-10 h-full w-full rounded-3xl border-2 border-gold/20" />
            </div>
          </AnimatedSection>

          {/* Vision / Mission / Values */}
          <div className="space-y-5">
            {(['vision', 'mission'] as const).map((key, i) => (
              <AnimatedSection key={key} delay={i * 0.1}>
                <div className="rounded-2xl bg-navy p-6 text-white">
                  <h3 className="mb-2 font-poppins text-lg font-bold text-gold">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-cloud/80">{t(`${key}.text`)}</p>
                </div>
              </AnimatedSection>
            ))}
            <AnimatedSection delay={0.2}>
              <div className="rounded-2xl bg-gold p-6">
                <h3 className="mb-3 font-poppins text-lg font-bold text-navy">
                  {t('values.title')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {valueItems.map((v) => (
                    <span
                      key={v}
                      className="rounded-full bg-navy/10 px-3 py-1 font-poppins text-sm font-semibold text-navy"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-cloud">
        <div className="container-section">
          <SectionHeader eyebrow={t('why.eyebrow')} title={t('why.title')} />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.08}>
                <div className="border-navy/8 h-full rounded-2xl border-2 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gold font-poppins text-xl font-bold text-navy">
                    {i + 1}
                  </div>
                  <h3 className="mb-2 font-poppins text-base font-bold text-navy">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-ink-500">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <CTABanner locale={locale} />
    </>
  );
}
