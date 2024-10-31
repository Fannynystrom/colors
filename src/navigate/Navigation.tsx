import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
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
      {isAuthenticated && (
        <ul className="nav-links">
          <li>
            <Link to="/home">Hem</Link>
          </li>
          <li>
            <Link to="/store">Butik</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          {role === 'admin' && (
            <li>
              <Link to="/admin">Admin</Link>
            </li>
          )}
          
          <li className="checkout-icon">
            <Link to="/pay">
              <FontAwesomeIcon icon={faShoppingCart} />
            </Link>
          </li>
        </ul>
      )}
      <ul className="auth-links">
        <li>
          {isAuthenticated ? (
            <Link to="/" onClick={logout}>Logga ut</Link>
          ) : (
            <Link to="/login">Logga in</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
