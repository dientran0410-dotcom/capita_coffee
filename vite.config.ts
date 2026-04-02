import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_GATEWAY = env.VITE_API_GATEWAY || 'https://api-gate-way-3ds5.onrender.com'
  const AUTH_SERVICE = (env.VITE_AUTH_SERVICE_URL || 'https://auth-service-wq2a.onrender.com')
    .replace(/\/+$/, '')
    .replace(/\/api\/auth-service$/i, '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api/auth-service': {
          target: AUTH_SERVICE,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '1',
          },
        },
        '/api': {
          target: API_GATEWAY,
          changeOrigin: true,
          secure: false,
          headers: {
            'ngrok-skip-browser-warning': '1',
          },
        },
      }
    }
  }
})
