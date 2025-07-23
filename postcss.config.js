// postcss.config.js
import autoprefixer from 'autoprefixer';
import tailwindcssPostcss from '@tailwindcss/postcss'; // <--- EXPLICITLY import the PostCSS plugin

export default {
  plugins: [ // <--- Keep this as an array
    tailwindcssPostcss(), // <--- Call the EXPLICITLY imported plugin
    autoprefixer(),
  ],
};