// frontend/vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno basadas en el modo
  // Remove process.cwd() - Vite usually finds the correct directory
  const env = loadEnv(mode, '', '')
  
  return {
    plugins: [react()],
    define: {
      // Hacer VITE_API_URL disponible en el código
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'https://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: 'https://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: 'https://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/admin': {
          target: 'https://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/logout': {
          target: 'https://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
})