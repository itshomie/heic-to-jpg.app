import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        heicToPng: resolve(__dirname, 'heic-to-png/index.html'),
        heicToPdf: resolve(__dirname, 'heic-to-pdf/index.html'),
        heifToJpg: resolve(__dirname, 'heif-to-jpg/index.html'),
        batchConvertHeicToJpg: resolve(__dirname, 'batch-convert-heic-to-jpg/index.html'),
        iphoneHeicToJpg: resolve(__dirname, 'iphone-heic-to-jpg/index.html'),
        heicVsJpg: resolve(__dirname, 'heic-vs-jpg/index.html'),
      },
    },
  },
});
