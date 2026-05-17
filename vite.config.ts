import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Deployed at the root of the custom domain (staff.tontonfrancky.com).
// Override via VITE_BASE=/staff-tonton-francky/ when serving from
// fbarrailla.github.io/staff-tonton-francky/ instead.
const base = process.env.VITE_BASE ?? '/'

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
