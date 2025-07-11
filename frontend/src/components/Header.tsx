/*
 * PURPOSE: Header component for the application
 *
 * The header provides:
 * 1. Navigation links to different parts of the app
 * 2. Branding or title ("Golf Swing Analyzer")
 * 3. Consistent presence across all pages/routes
 */

// Import React library
import React from 'react';
// Import Link component for navigation
import { Link } from 'react-router-dom';

// Define the Header component as a functional component
const Header: React.FC = () => {
  // Render the header structure
  return (
    // Header element with styling
    <header className="bg-white shadow-sm">
      {/* Container for header content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Flexbox layout for logo and navigation */}
        <div className="flex justify-between items-center h-16">
          {/* Link wrapping the title/logo */}
          <Link to="/" className="flex items-center">
            {/* Branding - App title */}
            <h1 className="text-2xl font-bold text-gray-900">
              Golf Swing Analyzer
            </h1>
          </Link>
          {/* Navigation links */}
          <nav className="flex space-x-8">
            {/* Link to the Home page for video upload */}
            <Link 
              to="/" 
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Upload
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

// Export the Header component
export default Header;
