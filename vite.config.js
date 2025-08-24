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
    outDir: path.resolve(__dirname, 'dist/public'), // absolute path for production build
    emptyOutDir: true,        // clear the folder before build
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,                 // Frontend dev server
    proxy: {
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
