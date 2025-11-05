import { useState, useEffect } from 'react'
import { Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./lib/firebase.js";
import './App.css'

// Import pages
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import NotFound from './pages/NotFound.jsx';
import Products from './pages/Products.jsx';
import Analyser from './pages/AnalyserPage.jsx';
import Profile from "./pages/Profile.jsx";
import PastDrills from "./pages/PastDrills.jsx";
import TermsAndCond from './pages/TermsAndCond.jsx';
import Privacy from './pages/Privacy.jsx';
import Success from './pages/Success.jsx';

// Import components
import Layout from './components/layout.jsx';
import RequireAuth from './auth/requireAuth.jsx';


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
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        {/* <Route path="/about" element={<About />} /> */}
        <Route path="/products" element={<Products />} />
        <Route path="/billing/success" element={<Success />} />
        <Route path="/legal/terms-and-conditions" element={<TermsAndCond />} />
        <Route path="/legal/privacy-policy" element={<Privacy />} />

        {/* Protected */}
        <Route element={<RequireAuth />}>
          <Route path="/analyse" element={<Analyser />} />
          {/* <Route path="/settings" element={<Settings />} /> */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/past-drills" element={<PastDrills />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App
