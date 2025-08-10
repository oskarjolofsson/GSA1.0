import '../styles/Topbar.css';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="logo">
            <a href="/" className="topbar-logo-link">
              <img src={logo} alt="Logo" className='topbar-logo'/>
            </a>
        </span>
      </div>
      <nav className="topbar-nav">
        <Link to="/services">Services</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/contact">Contact</Link>
      </nav>
      <div className="topbar-right">
        <button className="template-btn">☞ Register</button>
      </div>
    </header>
  );
}