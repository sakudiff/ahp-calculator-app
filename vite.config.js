// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Use an environment variable for the base path.
  // On Netlify, you would set VITE_APP_BASE_URL to '/'.
  // For GitHub Pages, you might set it to '/ahp-calculator-app/'
  // or rely on the build process specific to gh-pages.
  base: process.env.VITE_APP_BASE_URL || '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})