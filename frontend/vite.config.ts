// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Default Vite port
    strictPort: true, // Fail if port is already in use
    // Optional: Proxy API requests to the backend during development
    // Avoids CORS issues if backend/frontend run on different ports locally
    proxy: {
      '/api': { // Proxy requests starting with /api
        target: 'https://localhost:8000', // Your Django backend (HTTPS)
        changeOrigin: true,
        secure: false, // Allow self-signed certs in dev
        // rewrite: (path) => path.replace(/^\/api/, '/api') // Keep '/api' prefix
      },
      '/auth': { // Proxy social auth requests
        target: 'https://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
       '/static': { // Proxy static files if needed during dev (less common with Vite)
        target: 'https://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
       '/admin': { // Proxy admin
        target: 'https://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
       '/logout': { // Proxy logout
        target: 'https://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})