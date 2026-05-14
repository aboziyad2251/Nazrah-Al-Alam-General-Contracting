import type { Locale, Direction } from '@nazrah/types';

import ar from './locales/ar';
import en from './locales/en';

export type { TranslationKeys } from './locales/en';
export { en, ar };

// ─── Locale utilities ────────────────────────────────────────────────────────

export const locales: Locale[] = ['en', 'ar'];
export const defaultLocale: Locale = 'en';

export function getDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

/** Resolve the opposite locale for the lang switcher. */
export function toggleLocale(current: Locale): Locale {
  return current === 'en' ? 'ar' : 'en';
}

// ─── Translation function ────────────────────────────────────────────────────

const translations = { en, ar } as const;

export function getTranslations(locale: Locale) {
  return translations[locale] ?? translations[defaultLocale];
}

/**
 * Simple dot-path accessor with type safety.
 * Usage: t('nav.home')
 */
export type FlatKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? FlatKeys<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

type NestedValue<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? NestedValue<T[Key], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

export function createT(locale: Locale) {
  const dict = getTranslations(locale);
  return function t<K extends FlatKeys<typeof dict>>(key: K): NestedValue<typeof dict, K> {
    const parts = (key as string).split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = dict;
    for (const part of parts) {
      val = val?.[part];
    }
    return val;
  };
}
