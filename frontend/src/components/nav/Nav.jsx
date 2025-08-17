import { Link } from 'react-router-dom';
import './Nav.css';

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-logo">🔳</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
      </div>
      <div className='nav-action'>
        <button className="register">Register</button>
      </div>
    </nav>
  );
}

export default Nav;
