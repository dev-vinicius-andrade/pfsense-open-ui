import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const isDemo = process.env.VITE_DEMO_MODE === 'true';

export default defineConfig({
  // GitHub Pages serves from /<repo-name>/ subpath
  base: isDemo ? '/pfsense-open-ui/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/v2': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'https://192.168.1.1',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});