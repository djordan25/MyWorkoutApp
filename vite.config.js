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
