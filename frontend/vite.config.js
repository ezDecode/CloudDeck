import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      util: 'util',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['util', 'buffer'],
  },
  // Configure development server for better CORS handling
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  },
  // Build configuration for production
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'aws-sdk': ['@aws-sdk/client-s3', '@aws-sdk/lib-storage', '@aws-sdk/s3-request-presigner'],
        },
      },
    },
  },
})
