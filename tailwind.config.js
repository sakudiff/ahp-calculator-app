// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app.jsx",   // <--- ADD THIS LINE to ensure app.jsx is scanned.
    "./main.jsx",  // <--- ADD THIS LINE to ensure main.jsx is scanned.
    // "./src/**/*.{js,ts,jsx,tsx}", // Keep this if you have other files in a src folder.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}