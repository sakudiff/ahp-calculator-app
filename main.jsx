// main.jsx
import './index.css'; // Or whatever your main CSS file is named, and its correct relative path
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx'; // Assuming app.jsx is in the same directory as main.jsx

// Get the root DOM element from index.html
const rootElement = document.getElementById('root');

// Create a root and render your App component into it
// React.StrictMode is good practice for highlighting potential problems
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);