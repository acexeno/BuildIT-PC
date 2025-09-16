import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base so dist/index.html works under any subpath (e.g., /capstone2/dist/)
  base: './',
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      // Proxy API requests to XAMPP Apache backend (default port 80)
      '/backend/api': {
        target: 'http://localhost/capstone2', // If Apache uses a different port, e.g., 8080, use 'http://localhost:8080/capstone2'
        changeOrigin: true,
        secure: false,
      }
    },
  }
})