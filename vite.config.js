import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Use root base path for production deployment
  base: '/',
  root: '.',
  plugins: [react()],
  build: {
    outDir: 'backend/public',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure consistent asset paths
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      // Proxy API requests to XAMPP Apache backend (default port 80)
      '/api': {
        target: 'http://localhost/capstone2', // If Apache uses a different port, e.g., 8080, use 'http://localhost:8080/capstone2'
        changeOrigin: true,
        secure: false,
      }
    },
  }
})