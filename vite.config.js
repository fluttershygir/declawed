import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // In local dev, forward /api calls to Vercel CLI dev server on 3000
      // Run: `vercel dev` instead of `npm run dev` for full local API testing
      '/api': 'http://localhost:3000',
    },
  },
})
