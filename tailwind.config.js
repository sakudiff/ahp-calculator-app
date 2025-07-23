// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app.jsx",   // <--- ADD THIS LINE
    "./main.jsx",  // <--- ADD THIS LINE
    // Remove "./src/**/*.{js,ts,jsx,tsx}" if you don't have a src folder with other component files.
    // If you do have other components in src, keep it.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}