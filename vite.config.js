import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020', // Modern browsers — avoids legacy polyfills (~13 KiB saving)
    cssCodeSplit: true, // Split CSS per async chunk
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'swiper-vendor': ['swiper'],
          'motion-vendor': ['framer-motion'],
          'ui-vendor': ['lucide-react', 'react-hot-toast', 'clsx']
        }
      }
    }
  }
})
