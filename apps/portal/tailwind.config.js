/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0E1F3A', deep: '#0A1628' },
        gold: { DEFAULT: '#E8B339', soft: '#F2C75B' },
        cloud: '#D9DCE0',
        stone: '#E8EAED',
        ink: { 900: '#0F1117', 500: '#5A6573' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
