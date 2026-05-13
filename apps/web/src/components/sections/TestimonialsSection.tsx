import { getTranslations } from 'next-intl/server';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

function StarRating() {
  return (
    <div className="mb-3 flex gap-0.5" aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gold">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export async function TestimonialsSection({ locale: _locale }: { locale: string }) {
  const t = await getTranslations('home.testimonials');
  const items = t.raw('items') as {
    name: string;
    role: string;
    company: string;
    quote: string;
  }[];

  return (
    <section className="section-padding bg-white" id="testimonials">
      <div className="container-section">
        <SectionHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <AnimatedSection key={i} delay={[0, 0.08, 0.16][i]}>
              <figure className="border-navy/8 flex h-full flex-col rounded-2xl border-2 bg-cloud p-7 shadow-sm transition-shadow hover:shadow-navy-md">
                <StarRating />
                <blockquote className="text-ink-600 flex-1 text-sm leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-navy/10 pt-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-poppins text-sm font-bold text-white">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-poppins text-sm font-bold text-navy">{item.name}</p>
                    <p className="text-ink-400 text-xs">
                      {item.role} · {item.company}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
