import type { MetadataRoute } from 'next';
import { EQUIPMENT_CATEGORIES } from '@/data/equipment';

const BASE = 'https://nazrahalalam.com';
const locales = ['en', 'ar'];

const staticPages = [
  '',
  '/about',
  '/services',
  '/projects',
  '/equipment',
  '/brands',
  '/quote',
  '/contact',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${BASE}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: page === '' ? 1.0 : 0.8,
    }))
  );

  const equipmentEntries = locales.flatMap((locale) =>
    EQUIPMENT_CATEGORIES.map((cat) => ({
      url: `${BASE}/${locale}/equipment/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  );

  return [...staticEntries, ...equipmentEntries];
}
