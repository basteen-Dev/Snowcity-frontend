import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/i],
      threshold: 1024,
    }),
    // Brotli compression
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(gz)$/i],
      threshold: 1024,
    }),
    {
      name: 'rewrite-parkpanel',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.startsWith('/parkpanel')) {
            req.url = '/parkpanel/index.html';
          }
          next();
        });
      },
    },
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'parkpanel/index.html'),
      },
      plugins: [
        visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true
        })
      ],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'swiper-vendor': ['swiper'],
          'motion-vendor': ['framer-motion'],
          'ui-vendor': ['lucide-react', 'react-hot-toast', 'clsx'],
          'date-vendor': ['dayjs'],
          'style-vendor': ['styled-components'],
        }
      }
    }
  }
})
