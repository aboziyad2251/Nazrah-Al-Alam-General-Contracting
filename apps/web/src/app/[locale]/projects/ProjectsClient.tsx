'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PROJECTS, type ProjectCategory } from '@/data/projects';
import { AnimatedSection } from '@/components/ui/AnimatedSection';

export function ProjectsClient({ locale }: { locale: string }) {
  const t = useTranslations('projects');
  const isAr = locale === 'ar';
  const tabs: ProjectCategory[] = ['residential', 'commercial'];
  const [active, setActive] = useState<ProjectCategory>('residential');

  const filtered = PROJECTS.filter((p) => p.category === active);

  return (
    <>
      {/* Tabs */}
      <div className="mt-10 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={[
              'rounded-full px-5 py-2.5 font-poppins text-sm font-semibold transition-all',
              tab === active
                ? 'bg-navy text-white shadow-navy-md'
                : 'bg-white text-ink-500 hover:bg-navy/10 hover:text-navy',
            ].join(' ')}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project, i) => (
          <AnimatedSection key={project.id} delay={i * 0.07}>
            <div className="border-navy/8 h-full rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-navy-md">
              {/* Category badge */}
              <span className="mb-4 inline-block rounded-full bg-gold/15 px-3 py-0.5 font-poppins text-xs font-semibold text-navy">
                {isAr
                  ? active === 'residential'
                    ? 'سكني'
                    : 'تجاري'
                  : active.charAt(0).toUpperCase() + active.slice(1)}
              </span>

              <h3 className="font-poppins text-base font-bold leading-snug text-navy">
                {isAr ? project.typeAr : project.typeEn}
              </h3>

              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-gold">📍</span>
                  <div>
                    <span className="text-xs font-medium text-ink-500">{t('location')}: </span>
                    <span className="text-navy">
                      {isAr ? project.locationAr : project.locationEn}
                    </span>
                  </div>
                </div>
                {project.ownerEn && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-gold">👤</span>
                    <div>
                      <span className="text-xs font-medium text-ink-500">{t('owner')}: </span>
                      <span className="text-navy">{isAr ? project.ownerAr : project.ownerEn}</span>
                    </div>
                  </div>
                )}
                {project.area && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-gold">📐</span>
                    <div>
                      <span className="text-xs font-medium text-ink-500">{t('area')}: </span>
                      <span className="font-semibold text-navy">{project.area}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </>
  );
}
