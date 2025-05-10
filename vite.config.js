// This is a simplified vite config specifically for Render deployment
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 3000,
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': '/client/src',
      '@components': '/client/src/components',
      '@hooks': '/client/src/hooks',
      '@lib': '/client/src/lib',
      '@pages': '/client/src/pages',
      '@shared': '/shared',
      '@assets': '/attached_assets',
    },
  },
});