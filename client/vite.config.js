import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: resolve(__dirname, '../dist'),  // Output to student-membership-tracking/dist
    emptyOutDir: true  // Force empty the output directory to avoid stale files
  }
});