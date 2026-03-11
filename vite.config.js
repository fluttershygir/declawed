import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync } from 'fs'

// Copies dist/index.html → dist/404.html so CF Pages serves the React app
// for any unmatched path (e.g. /dashboard, /privacy), enabling client-side routing.
const spaFallback = {
  name: 'spa-fallback',
  closeBundle() {
    try { copyFileSync('dist/index.html', 'dist/404.html'); } catch {}
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
