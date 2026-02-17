import { useState, useEffect } from 'react'
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router.jsx";
import './App.css'


function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App
