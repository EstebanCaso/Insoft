import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/project/', // Cambia esto por el nombre de tu repositorio en GitHub
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
