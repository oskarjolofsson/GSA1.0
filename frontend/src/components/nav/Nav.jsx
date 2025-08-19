import { Link } from 'react-router-dom';
import './Nav.css';

function Nav() {
  return (
    <nav className="nav">
      <a href='/'>
        <div className="nav-logo">🔳</div>
      </a>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </div>
      <div className='nav-action'>
        <button className="register">Register</button>
      </div>
    </nav>
  );
}

export default Nav;
