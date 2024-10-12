import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NavigationStyles.css'; 

function Navigation() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Hem</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
