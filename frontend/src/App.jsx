import { useState } from 'react'
import { Routes, Route, Link } from "react-router-dom";
import './App.css'

// Import pages
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx"
import Result from "./pages/Results.jsx"
import NotFound from './pages/NotFound.jsx';

// Import components
import Nav from "./components/nav/Nav.jsx"

function App() {
  return (
    <div>
      <Nav />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/result" element={<Result />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App
