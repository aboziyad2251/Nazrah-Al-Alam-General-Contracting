import { getTranslations } from 'next-intl/server';
import { BRANDS } from '@/data/brands';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

export async function BrandsStrip({ locale }: { locale: string }) {
  const t = await getTranslations('home.brands');
  const isAr = locale === 'ar';

  return (
    <section className="section-padding bg-navy" id="brands">
      <div className="container-section">
        <SectionHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} light />

        <div className="mt-12 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
          {BRANDS.map((brand, i) => (
            <AnimatedSection key={brand.id} delay={i * 0.04}>
              <div className="bg-white/8 flex aspect-square flex-col items-center justify-center rounded-xl border border-white/10 p-3 transition-all duration-200 hover:border-gold/30 hover:bg-white/15">
                <span className="text-center font-poppins text-xs font-bold leading-tight text-white/70">
                  {brand.name}
                </span>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
