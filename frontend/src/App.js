import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Topbar from "./components/Topbar";
import Home from "./pages/Home";
import VideoUploadPage from './pages/VideoUploadPage';
import './styles/App.css';

function App() {
  const [message, setMessage] = useState('Loading...');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((error) => {
        console.error('Error fetching from backend:', error);
        setMessage('Failed to load message from Flask');
      });
  }, []); // empty dependency array = run only once on mount

  return (
  <Router>
    <div className="app">
      <Topbar />
      <main className="main-content" style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<VideoUploadPage />} />
        </Routes>
      </main>
    </div>
  </Router>
);
}

export default App;
