import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          Mood<span>Tune</span>
        </Link>
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Generator
          </Link>
          <Link 
            to="/journal" 
            className={`nav-link ${location.pathname === '/journal' ? 'active' : ''}`}
          >
            Mindfulness Journal
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
