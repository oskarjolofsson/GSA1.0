import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Golf Swing Analyzer
            </h1>
          </Link>
          <nav className="flex space-x-8">
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

export default Header;
