import { useState, useEffect } from 'react'
import { Routes, Route, Link } from "react-router-dom";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./lib/firebase";
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const login = async () => {
    await signInWithPopup(auth, googleProvider);
    // TODO??? IDTOKEN
  }

  const logout = () => signOut(auth);

  return (
    <div className="min-h-screen flex flex-col relative z-0 overflow-hidden bg-[#0b1020] text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-20 -z-10"
        style={{
          backgroundImage: "url('/icons/topography.svg')",
          backgroundRepeat: 'repeat',
          backgroundPosition: 'top left',
          backgroundSize: '1200px',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 via-black/20 to-transparent -z-10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-t from-transparent to-black/40 -z-10" />
      <Nav />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/register" element={<Register />} />
          <Route path="/analyse" element={<Analyser />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App
