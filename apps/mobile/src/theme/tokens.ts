import { I18nManager } from 'react-native';

export const colors = {
  navy: '#0E1F3A',
  gold: '#E8B339',
  cloud: '#D9DCE0',
  stone: '#E8EAED',
  white: '#FFFFFF',
  ink900: '#0F1117',
  ink700: '#2D3340',
  ink600: '#3D4552',
  ink500: '#5A6573',
  ink400: '#8A93A0',
  green: '#16A34A',
  greenBg: '#F0FDF4',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  red: '#DC2626',
  redBg: '#FEF2F2',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
};

export const typography = {
  xs: { fontSize: 11, lineHeight: 16 },
  sm: { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  md: { fontSize: 17, lineHeight: 24 },
  lg: { fontSize: 20, lineHeight: 28 },
  xl: { fontSize: 24, lineHeight: 32 },
  '2xl': { fontSize: 30, lineHeight: 38 },
};

// RTL-aware text alignment
export const textAlign = () => (I18nManager.isRTL ? ('right' as const) : ('left' as const));
export const flexDir = () => (I18nManager.isRTL ? ('row-reverse' as const) : ('row' as const));
