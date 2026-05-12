'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface HeroSectionProps {
  locale: string;
}

export function HeroSection({ locale }: HeroSectionProps) {
  const t = useTranslations('home.hero');
  const ts = useTranslations('home.stats');

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy"
      id="hero"
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 bg-[radial-gradient(theme(colors.gold.DEFAULT)_1px,transparent_0)] bg-[length:40px_40px] opacity-[0.06]"
        aria-hidden="true"
      />
      {/* Gold gradient blob */}
      <div
        className="pointer-events-none absolute -top-32 end-0 h-[700px] w-[700px] rounded-full bg-gold/10 blur-3xl will-change-transform"
        aria-hidden="true"
      />
      {/* Chevron watermark */}
      <div
        className="pointer-events-none absolute start-0 top-1/2 -translate-y-1/2 select-none opacity-5"
        aria-hidden="true"
      >
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
          <path
            d="M100 50L400 250L100 450"
            stroke="white"
            strokeWidth="60"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="container-section relative z-10 grid items-center gap-12 pb-16 pt-24 lg:grid-cols-2">
        {/* Text */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.25em] text-gold"
          >
            {t('eyebrow')}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="whitespace-pre-line font-poppins text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl"
          >
            {t('tagline')} <span className="text-gold">{t('tagline2')}</span> {t('tagline3')}
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="origin-start mt-4 h-1.5 w-20 rounded-full bg-gold"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-cloud/80"
          >
            {t('subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href={`/${locale}/projects`}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-7 py-3.5 font-poppins text-base font-bold text-navy transition-colors hover:bg-gold-soft"
            >
              {t('cta')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href={`/${locale}/quote`}
              className="inline-flex items-center rounded-xl border-2 border-white/25 px-7 py-3.5 font-poppins text-base font-semibold text-white transition-colors hover:border-gold hover:text-gold"
            >
              {t('ctaSecondary')}
            </Link>
          </motion.div>
        </div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          {(
            [
              { value: '25+', labelKey: 'experience' },
              { value: '400+', labelKey: 'projects' },
              { value: '40+', labelKey: 'equipment' },
              { value: '200+', labelKey: 'clients' },
            ] as const
          ).map(({ value, labelKey }) => (
            <div
              key={labelKey}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
            >
              <p className="font-poppins text-4xl font-extrabold text-gold">{value}</p>
              <p className="mt-1.5 font-poppins text-sm text-cloud/70">{ts(labelKey)}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M5 12l7 7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </section>
  );
}
