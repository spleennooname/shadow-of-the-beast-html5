import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  base: process.env.NODE_ENV === 'production' ? '/shadow-of-the-beast-html5/' : './'
});