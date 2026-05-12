/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0E1F3A',
          deep: '#0A1628',
        },
        gold: {
          DEFAULT: '#E8B339',
          soft: '#F2C75B',
        },
        cloud: '#D9DCE0',
        stone: '#E8EAED',
        ink: {
          900: '#0F1117',
          500: '#5A6573',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          hover: '#1FB855',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
        arabic: ['var(--font-ibm-plex-arabic)', 'IBM Plex Sans Arabic', 'sans-serif'],
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        88: '22rem',
        120: '30rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'gold-sm': '0 2px 12px 0 rgba(232,179,57,0.15)',
        'gold-md': '0 4px 24px 0 rgba(232,179,57,0.25)',
        'navy-md': '0 4px 24px 0 rgba(14,31,58,0.20)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
};
