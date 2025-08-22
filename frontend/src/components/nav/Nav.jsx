import { Link } from 'react-router-dom';
import './Nav.css';

function Nav() {
  return (
    <nav className="nav">
      <Link to="/">
        <img
            src="/icons/logo.png"
            alt="logo"
            className="nav-logo"
          />
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/about">About</Link>
      </div>
      <div className='nav-action'>
        <Link className="register" to="/register">Register</Link>
      </div>
    </nav>
  );
}

export default Nav;
