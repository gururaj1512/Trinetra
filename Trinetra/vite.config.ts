import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://13.203.216.210:5001',
        changeOrigin: true,
        secure: false,
      },
      '/crowd-api': {
        target: 'http://13.203.217.65:5002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/crowd-api/, '/api/analyze')
      },
      '/emergency-api': {
        target: 'https://image-recognition-gy0r.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/emergency-api/, '/')
      },
      '/behavior-api': {
        target: 'https://gun-detection.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/behavior-api/, '/analyze')
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
