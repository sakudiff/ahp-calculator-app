// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app.jsx", // <--- ADD THIS LINE if app.jsx is at the root.
    "./src/**/*.{js,ts,jsx,tsx}", // Keep this if you have a src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}