import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: 'dist',
    // Copy public assets
    copyPublicDir: true,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'vendor': ['preact']
        },
        // Don't hash these specific assets
        assetFileNames: (assetInfo) => {
          // Keep manifest.json, icons, and other PWA assets without hashes
          if (assetInfo.name === 'manifest.json' || 
              assetInfo.name.match(/\.(png|ico)$/)) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Ensure service worker and other assets are handled correctly
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  }
});
