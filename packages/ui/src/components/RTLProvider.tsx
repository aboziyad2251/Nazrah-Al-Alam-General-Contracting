'use client';

import React, { createContext, useContext } from 'react';

import type { Locale, Direction } from '@nazrah/types';
import { getDirection } from '@nazrah/i18n';

// ─── Context ──────────────────────────────────────────────────────────────────
interface RTLContextValue {
  locale: Locale;
  dir: Direction;
  isRTL: boolean;
}

const RTLContext = createContext<RTLContextValue>({
  locale: 'en',
  dir: 'ltr',
  isRTL: false,
});

export function useRTL() {
  return useContext(RTLContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export interface RTLProviderProps {
  locale: Locale;
  children: React.ReactNode;
  /**
   * When true, RTLProvider wraps children in a <div dir="...">
   * Set to false when the app root already sets the dir attribute (e.g. Next.js).
   */
  wrapWithDiv?: boolean;
}

export const RTLProvider: React.FC<RTLProviderProps> = ({
  locale,
  children,
  wrapWithDiv = false,
}) => {
  const dir = getDirection(locale);

  const value: RTLContextValue = {
    locale,
    dir,
    isRTL: dir === 'rtl',
  };

  return (
    <RTLContext.Provider value={value}>
      {wrapWithDiv ? (
        <div dir={dir} lang={locale} className="contents">
          {children}
        </div>
      ) : (
        children
      )}
    </RTLContext.Provider>
  );
};

RTLProvider.displayName = 'RTLProvider';
