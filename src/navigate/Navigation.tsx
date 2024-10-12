import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NavigationStyles.css';

function Navigation() {
  return (
    <nav>
      <ul className="nav-links">
        <li>
          <Link to="/">Hem</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>
      <ul className="auth-links">
        <li>
          <Link to="/login">Log out/Login</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
