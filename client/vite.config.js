import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'  // Proxy API requests during development to your backend server
    }
  },
  build: {
    outDir: 'dist'  // Output folder for production build
  }
});
