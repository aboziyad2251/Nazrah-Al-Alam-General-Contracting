import { getTranslations } from '@nazrah/i18n';
import type { Locale } from '@nazrah/types';
import { Button, SectionHeader, BrandLogo, ChevronArrow } from '@nazrah/ui';
import type { Metadata } from 'next';

interface HomePageProps {
  params: { locale?: Locale };
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const locale = params?.locale ?? 'en';
  return {
    title: locale === 'ar' ? 'نظرة العالم للمقاولات العامة' : 'Nazrah Al Alam General Contracting',
    description:
      locale === 'ar'
        ? 'شركة مقاولات عامة رائدة في المملكة العربية السعودية'
        : 'Leading general contracting firm in Saudi Arabia',
  };
}

export default function HomePage({ params }: HomePageProps) {
  const locale: Locale = (params?.locale as Locale) ?? 'en';
  const t = getTranslations(locale);
  const isRTL = locale === 'ar';

  const stats = [
    { value: '25+', label: t.about.yearsExperience },
    { value: '400+', label: t.about.projectsCompleted },
    { value: '200+', label: t.about.happyClients },
    { value: '1,200+', label: t.about.teamMembers },
  ];

  return (
    <main>
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md">
        <div className="container-section flex h-16 items-center justify-between">
          <BrandLogo theme="dark" size="sm" />
          <div className="hidden items-center gap-8 md:flex">
            {(['home', 'services', 'projects', 'equipment', 'contact'] as const).map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="font-poppins text-sm font-medium text-cloud/80 transition-colors hover:text-gold"
              >
                {t.nav[key]}
              </a>
            ))}
          </div>
          <Button variant="gold" size="sm">
            {t.nav.getQuote}
          </Button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #E8B339 1px, transparent 0)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        {/* Gold accent blob */}
        <div
          className="absolute -top-40 end-0 h-[600px] w-[600px] rounded-full bg-gold/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="container-section relative z-10 py-32 text-center lg:text-start">
          <p className="mb-4 animate-fade-in font-poppins text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            {locale === 'ar' ? 'منذ عام 1999' : 'Est. 1999 · Saudi Arabia'}
          </p>
          <h1 className="mb-6 animate-slide-up font-poppins text-5xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl">
            {t.hero.tagline}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl animate-fade-in text-lg leading-relaxed text-cloud/80 lg:mx-0">
            {t.hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Button
              variant="gold"
              size="lg"
              rightIcon={<ChevronArrow size={18} colorClass="text-navy" />}
            >
              {t.hero.cta}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="!border-white/30 !text-white hover:!border-gold hover:!bg-transparent hover:!text-gold"
            >
              {t.hero.ctaSecondary}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="bg-gold py-12">
        <div className="container-section grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-poppins text-4xl font-extrabold text-navy">{value}</p>
              <p className="mt-1 text-sm font-medium text-navy/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services Preview ────────────────────────────────────────────── */}
      <section id="services" className="section-padding bg-white">
        <div className="container-section">
          <SectionHeader
            eyebrow={locale === 'ar' ? 'ما نقدمه' : 'What We Do'}
            title={t.services.title}
            subtitle={t.services.subtitle}
          />
        </div>
      </section>
    </main>
  );
}
