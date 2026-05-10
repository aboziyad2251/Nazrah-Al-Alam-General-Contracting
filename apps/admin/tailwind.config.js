/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0E1F3A', deep: '#0A1628', light: '#162d55' },
        gold: { DEFAULT: '#E8B339', soft: '#F2C75B' },
        cloud: '#D9DCE0',
        stone: '#E8EAED',
        ink: { 900: '#0F1117', 700: '#2D3748', 500: '#5A6573' },
        sidebar: '#0d1b32',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'Cairo', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
};
