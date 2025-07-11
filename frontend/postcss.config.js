/*
 * PURPOSE: PostCSS configuration file
 * 
 * PostCSS is a tool for transforming CSS with JavaScript.
 * It processes your CSS through various plugins to:
 * - Add vendor prefixes automatically
 * - Process Tailwind CSS directives
 * - Optimize and transform CSS
 * 
 * This file is used by Create React App to process CSS files.
 */

module.exports = {
  plugins: {
    // Tailwind CSS plugin - processes @tailwind directives in CSS files
    // Converts utility classes and generates the final CSS
    tailwindcss: {},
    
    // Autoprefixer plugin - automatically adds vendor prefixes to CSS
    // Ensures cross-browser compatibility (e.g., -webkit-, -moz-, -ms-)
    autoprefixer: {},
  },
}
