'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { EQUIPMENT_CATEGORIES } from '@/data/equipment';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function EquipmentCarousel({ locale }: { locale: string }) {
  const t = useTranslations('home.equipment');
  const te = useTranslations('equipment');
  const tc = useTranslations('common');
  const isAr = locale === 'ar';
  const [active, setActive] = useState(0);
  const categories = EQUIPMENT_CATEGORIES;

  return (
    <section className="section-padding bg-cloud" id="equipment">
      <div className="container-section">
        <SectionHeader eyebrow={t('eyebrow')} title={t('title')} subtitle={t('subtitle')} />

        {/* Category tabs */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {categories.map((cat, i) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active ? true : false}
              className={[
                'rounded-full px-4 py-2 font-poppins text-sm font-semibold transition-all',
                i === active
                  ? 'bg-navy text-white shadow-navy-md'
                  : 'bg-white text-ink-500 hover:bg-navy/10 hover:text-navy',
              ].join(' ')}
            >
              {cat.icon} {isAr ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Active category */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {categories[active].models.slice(0, 4).map((model) => (
              <div
                key={model.id}
                className="border-navy/8 overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-navy-md"
              >
                {/* Hex image area */}
                <div className="relative flex h-44 items-center justify-center bg-navy/5">
                  <svg width="180" height="180" viewBox="0 0 180 180" className="absolute">
                    <defs>
                      <clipPath id={`hex-${model.id}`}>
                        <polygon points="90,5 165,47.5 165,132.5 90,175 15,132.5 15,47.5" />
                      </clipPath>
                    </defs>
                    <image
                      href={model.image}
                      x="0"
                      y="0"
                      width="180"
                      height="180"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#hex-${model.id})`}
                    />
                  </svg>
                </div>
                <div className="p-4">
                  <p className="font-poppins text-xs font-medium text-ink-500">{model.brand}</p>
                  <h3 className="mt-0.5 font-poppins font-bold text-navy">
                    {isAr ? model.nameAr : model.nameEn}
                  </h3>
                  <div className="mt-3 space-y-1">
                    {model.specs.slice(0, 2).map((s) => (
                      <div key={s.labelEn} className="flex justify-between text-xs">
                        <span className="text-ink-500">{isAr ? s.labelAr : s.labelEn}</span>
                        <span className="font-semibold text-navy">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/${locale}/equipment/${categories[active].slug}`}
                    className="mt-4 block w-full rounded-xl bg-gold py-2 text-center font-poppins text-sm font-bold text-navy transition-colors hover:bg-gold-soft"
                  >
                    {te('requestQuote')}
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/equipment`}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-navy px-6 py-3 font-poppins text-sm font-bold text-navy transition-all hover:bg-navy hover:text-white"
          >
            {tc('viewAll')}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rtl:rotate-180">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
