// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Must match the GitHub repo name exactly — the app is served from
  // <user>.github.io/rp/, and without this every asset 404s.
  // Change to '/' if it ever moves to a root domain.
  base: '/rp/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
