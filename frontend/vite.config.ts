import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local dev, point the SWA CLI / vite dev server at a locally running
      // `func start` on 7071. In production, Static Web Apps routes /api/* to the
      // linked Function App automatically.
      '/api': {
        target: 'http://localhost:7071',
        changeOrigin: true,
      },
    },
  },
})
