/*
 * PURPOSE: Tailwind CSS configuration file
 * 
 * This file configures Tailwind CSS for your React application.
 * Tailwind is a utility-first CSS framework that provides low-level utility classes
 * to build custom designs without writing custom CSS.
 * 
 * Key configurations:
 * - content: Tells Tailwind which files to scan for class names
 * - theme: Customizes the default Tailwind theme
 * - plugins: Adds additional Tailwind plugins
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Content array tells Tailwind which files to scan for class names
  // This is important for "purging" - removing unused CSS in production
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/JSX/TS/TSX files in src directory
  ],
  
  // Theme section allows you to customize Tailwind's default theme
  theme: {
    extend: {
      // You can extend the default theme here
      // For example: colors, fonts, spacing, etc.
      // Currently empty, using all Tailwind defaults
    },
  },
  
  // Plugins array allows you to add additional Tailwind plugins
  // For example: forms, typography, aspect-ratio, etc.
  plugins: [],
}
