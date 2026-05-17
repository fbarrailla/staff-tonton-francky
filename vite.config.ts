import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// GitHub Pages serves project sites at https://<user>.github.io/<repo>/
// Override via VITE_BASE=/ for previews/custom domains/root deployment.
const base = process.env.VITE_BASE ?? '/staff-tonton-francky/'

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
})
