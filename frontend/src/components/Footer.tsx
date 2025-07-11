/*
 * PURPOSE: Footer component for the application
 * 
 * This component provides:
 * 1. A consistent footer that appears at the bottom of every page
 * 2. Copyright information and branding
 * 3. Simple layout with centered text
 */

// Import React library
import React from 'react';

// Define the Footer component
const Footer: React.FC = () => {
  // Render the footer
  return (
    // Footer element with styling
    <footer className="bg-white border-t border-gray-200">
      {/* Container for footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Centered text content */}
        <div className="text-center text-gray-500">
          <p>&copy; 2024 Golf Swing Analyzer. AI-powered golf training.</p>
        </div>
      </div>
    </footer>
  );
};

// Export the Footer component
export default Footer;
