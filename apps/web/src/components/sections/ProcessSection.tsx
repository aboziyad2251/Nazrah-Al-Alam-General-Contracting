import { getTranslations } from 'next-intl/server';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

export async function ProcessSection({ locale: _locale }: { locale: string }) {
  const t = await getTranslations('home.process');
  const steps = t.raw('steps') as { number: string; title: string; desc: string }[];

  return (
    <section className="section-padding bg-cloud" id="how-we-work">
      <div className="container-section">
        <SectionHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

        <div className="relative mt-16">
          {/* connecting line — desktop only */}
          <div
            className="absolute end-0 start-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent lg:block"
            aria-hidden
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {steps.map((step, i) => (
              <AnimatedSection key={i} delay={[0, 0.08, 0.16][i]}>
                <div className="relative flex flex-col items-center text-center">
                  {/* number bubble */}
                  <div className="relative z-10 mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold/60 bg-white shadow-md">
                    <span className="font-poppins text-2xl font-extrabold text-gold">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mb-2 font-poppins text-lg font-bold text-navy">{step.title}</h3>
                  <p className="max-w-xs text-sm leading-relaxed text-ink-500">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
