// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // This is critical for Netlify to find your assets at the root of the deployed site.
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})