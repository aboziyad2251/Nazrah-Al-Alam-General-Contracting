import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { HeroSection } from '@/components/sections/HeroSection';
import { ServicesGrid } from '@/components/sections/ServicesGrid';
import { EquipmentCarousel } from '@/components/sections/EquipmentCarousel';
import { BrandsStrip } from '@/components/sections/BrandsStrip';
import { CTABanner } from '@/components/sections/CTABanner';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'ar' ? 'نظرة العالم للمقاولات العامة' : 'Nazrah Al Alam General Contracting',
    description:
      locale === 'ar'
        ? 'شركة مقاولات عامة رائدة في جدة، المملكة العربية السعودية منذ عام 1999.'
        : 'Leading general contracting firm in Jeddah, Saudi Arabia since 1999. Civil, mechanical, electrical and infrastructure projects.',
    alternates: {
      canonical: `https://nazrahalalam.com/${locale}`,
      languages: { en: 'https://nazrahalalam.com/en', ar: 'https://nazrahalalam.com/ar' },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <HeroSection locale={locale} />
      <ServicesGrid locale={locale} />
      <EquipmentCarousel locale={locale} />
      <BrandsStrip locale={locale} />
      <CTABanner locale={locale} />
    </>
  );
}
