// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app.jsx",   // <--- THIS MUST BE PRESENT
    "./main.jsx",  // <--- THIS MUST BE PRESENT
    // REMOVE "./src/**/*.{js,ts,jsx,tsx}", if you don't have a 'src' folder with other components.
    // If you DO have other component files in a 'src' folder, then keep this line:
    // "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}