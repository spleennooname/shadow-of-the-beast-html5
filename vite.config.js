import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize for tree shaking and bundle size
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      /*output: {
        // Granular chunk splitting for better caching and smaller chunks
        manualChunks: (id) => {
          // PIXI.js core - split into smaller chunks
          if (id.includes('pixi.js')) {
            if (id.includes('graphics')) return 'pixi-graphics';
            if (id.includes('sprite')) return 'pixi-sprites';
            if (id.includes('container')) return 'pixi-container';
            if (id.includes('renderer')) return 'pixi-renderer';
            if (id.includes('texture')) return 'pixi-textures';
            if (id.includes('filters')) return 'pixi-core-filters';
            return 'pixi-core';
          }
          
          // PIXI Filters - separate chunk
          if (id.includes('pixi-filters')) {
            return 'pixi-filters';
          }
          
          // Vendor dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }*/
    },
    // Increase chunk size warning limit for game assets
    chunkSizeWarningLimit: 1000,
    // Enable tree shaking
    treeshake: true,
    // Remove unused CSS
    cssCodeSplit: true,
    // Optimize dependencies
    commonjsOptions: {
      include: ['node_modules/**']
    }
  },
  // Optimize dependencies for better tree shaking
  optimizeDeps: {
    include: ['pixi.js', 'pixi-filters'],
    // Force optimization of these packages
    force: true
  },
  // Enable esbuild optimizations
  esbuild: {
    drop: ['console', 'debugger'], // Remove console.log and debugger in production
    legalComments: 'none'
  }
});