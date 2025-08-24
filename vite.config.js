import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: 'client',              // Vite's project root (frontend)
  publicDir: 'public',         // Public assets folder inside 'client'
  build: {
    outDir: '../dist/public',   // Output frontend build for backend to serve
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Optional: separate React dependencies into a vendor chunk
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,                 // Frontend dev server
    proxy: {
      // Proxy API requests to backend dev server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@/components': path.resolve(__dirname, './client/src/components'),
      '@/lib': path.resolve(__dirname, './client/src/lib'),
      '@/hooks': path.resolve(__dirname, './client/src/hooks'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
