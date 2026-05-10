import type { Metadata } from 'next';

import { getTranslations } from '@nazrah/i18n';
import type { Locale } from '@nazrah/types';

import { HomeHero } from '@/components/HomeHero';
import { HomeStats } from '@/components/HomeStats';
import { HomeNavbar } from '@/components/HomeNavbar';

interface HomePageProps {
  params: Promise<{ locale?: Locale }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale = 'en' } = await params;
  return {
    title: locale === 'ar' ? 'نظرة العالم للمقاولات العامة' : 'Nazrah Al Alam General Contracting',
    description:
      locale === 'ar'
        ? 'شركة مقاولات عامة رائدة في المملكة العربية السعودية'
        : 'Leading general contracting firm in Saudi Arabia',
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale = 'en' } = await params;
  const t = getTranslations(locale as Locale);

  const stats = [
    { value: '25+', label: t.about.yearsExperience },
    { value: '400+', label: t.about.projectsCompleted },
    { value: '200+', label: t.about.happyClients },
    { value: '1,200+', label: t.about.teamMembers },
  ];

  return (
    <main>
      <HomeNavbar locale={locale as Locale} t={t.nav} />
      <HomeHero locale={locale as Locale} t={t.hero} />
      <HomeStats stats={stats} />

      {/* ── Services Preview ────────────────────────────────────────────── */}
      <section id="services" className="section-padding bg-white">
        <div className="container-section text-center">
          <p className="font-poppins text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {locale === 'ar' ? 'ما نقدمه' : 'What We Do'}
          </p>
          <h2 className="mt-3 font-poppins text-4xl font-bold text-navy">{t.services.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-500">{t.services.subtitle}</p>
        </div>
      </section>
    </main>
  );
}
