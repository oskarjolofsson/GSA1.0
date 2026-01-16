import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
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
import ResultsPage from "./pages/ResultsPage.jsx";
import TermsAndCond from './pages/TermsAndCond.jsx';
import Privacy from './pages/Privacy.jsx';
import Success from './pages/Success.jsx';
import Cancel from './pages/Cancel.jsx';
import DashboardUpload from './pages/DashboardUpload.jsx';
import Drills from './pages/Drills.jsx';
import Analysis from './pages/Analysis.jsx'

// Import components
import Layout from './components/PublicLayout.jsx';
import RequireAuth from './auth/requireAuth.jsx';
import DashboardLayout from './components/dashboard/DashboardLayout.jsx';


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
        {/* <Route path="/products" element={<Products />} /> */}
        <Route path="/legal/terms-and-conditions" element={<TermsAndCond />} />
        <Route path="/legal/privacy-policy" element={<Privacy />} />
        <Route path="/results/:analysisId" element={<ResultsPage />} />
      </Route>

      <Route element ={<RequireAuth/>}>
        <Route path ="/dashboard" element={<DashboardLayout />}>
          <Route index element = {<Navigate to="upload" replace/> }/>

          <Route path="upload" element={<DashboardUpload/>}/>
          <Route path="billing/cancel" element={<Cancel />} />
          <Route path="analyse" element={<Analysis />} />
          <Route path="profile" element={<Profile />} />
          <Route path="drills" element={<Drills />} />

          {/* <Route path="/billing/success" element={<Success />} />
          <Route path="/past-drills" element={<PastDrills />} />
          <Route path="/analyse" element={<Analyser />} /> */}
        </Route>
      </Route>
      

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App
