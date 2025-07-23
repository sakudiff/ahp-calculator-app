// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/', // <--- THIS IS CRITICAL AND MUST BE '/'
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})