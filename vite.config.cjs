// vite.config.cjs - CommonJS version specifically for Render
module.exports = {
  plugins: [],
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
};