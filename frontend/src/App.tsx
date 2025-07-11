/*
 * PURPOSE: Main App component that sets up routing and layout
 * 
 * This is the root component of your application. It:
 * 1. Sets up React Router for navigation between pages
 * 2. Defines the overall layout structure (Header, Main content, Footer)
 * 3. Defines which components to show for each URL path
 * 4. Acts as the "container" for your entire application
 */

// Import React library
import React from 'react';
// Import routing components from React Router
// BrowserRouter manages the URL and navigation
// Routes and Route define which components to show for each URL
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import layout components
import Header from './components/Header';  // Top navigation bar
import Footer from './components/Footer';  // Bottom footer

// Import page components
import Home from './pages/Home';       // Home page - video upload and analysis
import Results from './pages/Results'; // Results page - shows analysis results

// Main App component - this is a functional component
function App() {
  return (
    // Router enables navigation between different pages/URLs
    <Router>
      {/* Main container with flexbox layout */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header component - shows on every page */}
        <Header />
        
        {/* Main content area - this changes based on the current URL */}
        <main className="flex-1">
          {/* Routes define which component to show for each URL path */}
          <Routes>
            {/* When user visits "/" (root), show the Home component */}
            <Route path="/" element={<Home />} />
            {/* When user visits "/results", show the Results component */}
            <Route path="/results" element={<Results />} />
          </Routes>
        </main>
        
        {/* Footer component - shows on every page */}
        <Footer />
      </div>
    </Router>
  );
}

// Export the App component so it can be imported and used in other files
export default App;
