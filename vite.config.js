import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { 
    host: true, // Esto permite que Vite escuche en la IP 192.168.1.73
    port: 5173,
    strictPort: true, // Evita que cambie de puerto si el 5173 está ocupado
    proxy: {
      '/oauth2': {
        target: 'https://superadditional-septariate-olevia.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
      },
      '/login/oauth2': {
        target: 'https://superadditional-septariate-olevia.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
      },
    },
    // Esto es vital si ngrok intenta comunicarse por WebSockets (HMR)
    allowedHosts: [
      'superadditional-septariate-olevia.ngrok-free.dev'
    ]
  },
})