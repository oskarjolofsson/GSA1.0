import { useState } from 'react'
import { Routes, Route, Link } from "react-router-dom";
import './App.css'

// Import pages
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import NotFound from './pages/NotFound.jsx';
import Products from './pages/Products.jsx';
import Register from './pages/Register.jsx';
import Analyser from './pages/AnalyserPage.jsx';

// Import components
import Nav from "./components/nav/Nav2.jsx"
import Footer from './components/footer/footer.jsx';


function App() {
  return (
    <div>
      <Nav />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/register" element={<Register />} />
        <Route path="/analyse" element={<Analyser />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  );
}

export default App
