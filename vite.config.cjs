// vite.config.cjs - CommonJS version specifically for Render
const path = require('path');
const { fileURLToPath } = require('url');

module.exports = {
  plugins: [
    require('@vitejs/plugin-react')()
  ],
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@components': path.resolve(__dirname, 'client/src/components'),
      '@hooks': path.resolve(__dirname, 'client/src/hooks'),
      '@lib': path.resolve(__dirname, 'client/src/lib'),
      '@pages': path.resolve(__dirname, 'client/src/pages'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
};