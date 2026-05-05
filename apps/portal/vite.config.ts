import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@nazrah/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@nazrah/i18n': path.resolve(__dirname, '../../packages/i18n/src/index.ts'),
      '@nazrah/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
    },
  },
  server: {
    port: 3001,
    open: true,
  },
});
