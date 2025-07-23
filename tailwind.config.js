// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,jsx,ts,tsx}", // <--- New: Scan JS/JSX/TS/TSX directly in root
    "./src/**/*.{js,jsx,ts,tsx}", // <--- New: Scan any files in a 'src' folder (common React pattern)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}