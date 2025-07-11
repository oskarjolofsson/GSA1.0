/*
 * PURPOSE: Entry point for the React application
 * 
 * This file is the starting point of your React app. It:
 * 1. Finds the HTML element with id="root" in public/index.html
 * 2. Creates a React root and renders the entire App component inside it
 * 3. This is where React "takes over" the HTML page and starts managing the UI
 */

// Import React library for creating components
import React from 'react';
// Import ReactDOM for rendering React components to the browser DOM
import ReactDOM from 'react-dom/client';
// Import global CSS styles that apply to the entire app
import './index.css';
// Import the main App component that contains our entire application
import App from './App';

// Create a React root - this is where React will render our app
// It finds the <div id="root"> in public/index.html and uses it as the container
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Render the App component inside the root element
// React.StrictMode is a development tool that helps catch bugs and warns about deprecated features
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
