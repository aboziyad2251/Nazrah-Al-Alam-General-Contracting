import { getTranslations } from 'next-intl/server';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

const ICONS = ['🏆', '🚜', '👷', '⏱️', '🦺', '📞'];

export async function WhyChooseUs({ locale: _locale }: { locale: string }) {
  const t = await getTranslations('about.why');
  const items = t.raw('items') as { title: string; desc: string }[];

  return (
    <section className="section-padding bg-navy" id="why-choose-us">
      <div className="container-section">
        <SectionHeader eyebrow={t('eyebrow')} title={t('title')} subtitle="" light />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const delays = [0, 0.08, 0.16];
            const card = (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:border-gold/40 hover:bg-white/10"
              >
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-2xl">
                  {ICONS[i]}
                </span>
                <div>
                  <h3 className="mb-1 font-poppins text-base font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/65">{item.desc}</p>
                </div>
              </div>
            );
            return i < 3 ? (
              <AnimatedSection key={i} delay={delays[i]}>
                {card}
              </AnimatedSection>
            ) : (
              card
            );
          })}
        </div>
      </div>
    </section>
  );
}
