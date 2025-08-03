import '../styles/Topbar.css';
import logo from '../assets/logo.png';

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
        <a href="#">Services</a>
        <a href="#">Pricing</a>
        <a href="#">Contact</a>
      </nav>
      <div className="topbar-right">
        <button className="template-btn">☞ Register</button>
      </div>
    </header>
  );
}