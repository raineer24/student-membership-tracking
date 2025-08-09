// client/vitest.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Existing Vite configuration
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  
  css: {
    postcss: './postcss.config.js'
  },
  
  // Vitest test configuration
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
    css: true,
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});