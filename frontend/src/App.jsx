import { useState, useEffect } from 'react'
import { RouterProvider } from "react-router-dom";
import { onAuthStateChanged, signOut, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./lib/firebase.js";
import { router } from "./app/router.jsx";
import './App.css'


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
    <RouterProvider router={router} />
  );
}

export default App
