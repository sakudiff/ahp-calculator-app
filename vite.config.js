// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // <--- CHANGE THIS LINE! This tells Vite your app is served from the root.
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})