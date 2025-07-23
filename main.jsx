import React from 'react';
import ReactDOM from 'react-dom/client'; // Import from 'react-dom/client' for React 18+/19
import App from './app.jsx'; // Correctly import your App component

// Get the root DOM element from index.html
const rootElement = document.getElementById('root');

// Create a root and render your App component into it
// React.StrictMode is good practice for highlighting potential problems
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);