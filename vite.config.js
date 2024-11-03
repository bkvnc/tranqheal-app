import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',  // Ensures Wasm support
  },
  server: {
    historyApiFallback: true,
  },
  assetsInclude: ['**/*.wasm'],  // Ensures Vite includes Wasm files
});
