import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NavigationStyles.css';
import { AuthContext } from '../context/AuthContext';

function Navigation() {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return null; 
  }

  const { isAuthenticated, role, logout } = authContext;

  return (
    <nav>
      <ul className="nav-links">
        <li>
          <Link to="/">Hem</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        {isAuthenticated && role === 'admin' && ( // visar Admin-länk om inloggad som admin
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        )}
      </ul>
      <ul className="auth-links">
        <li>
          {isAuthenticated ? (
            <Link to="/login" onClick={logout}>Logga ut</Link>
          ) : (
            <Link to="/login">Logga in</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
