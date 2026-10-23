import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    // Reduce the main bundle size by splitting vendor libs into separate,
    // cacheable chunks. Route-level lazy() chunks are already created by React.
    rollupOptions: {
      output: {
manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios'],
          toast: ['react-toastify'],
          charts: ['recharts'],
        },
      },
    },
    // Keep chunk size warnings reasonable (default is 500 KB).
    chunkSizeWarningLimit: 600,
  },
});
