import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        guides: resolve(__dirname, 'guides/index.html'),
        batchHeicToJpg: resolve(__dirname, 'guides/batch-heic-to-jpg/index.html'),
        convertHeicToJpg: resolve(__dirname, 'guides/convert-heic-to-jpg/index.html'),
        heicToJpeg: resolve(__dirname, 'guides/heic-to-jpeg/index.html'),
        heicToJpgWindows: resolve(__dirname, 'guides/heic-to-jpg-windows/index.html'),
        heicVsJpg: resolve(__dirname, 'guides/heic-vs-jpg/index.html'),
        iphoneHeicToJpg: resolve(__dirname, 'guides/iphone-heic-to-jpg/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
      },
    },
  },
});
