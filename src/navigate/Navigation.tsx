import '../styles/NavigationStyles.css';
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';

function Navigation() {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    return null;
  }

  const { isAuthenticated, role, logout, cartTotalCount } = authContext;

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
            <Link to="/pay" className="cart-link">
              <FontAwesomeIcon icon={faShoppingCart} />
              {cartTotalCount > 0 && <span className="cart-count">{cartTotalCount}</span>}
            </Link>
          </li>
        </ul>
      )}
      <ul className="auth-links">
        <li>
          {isAuthenticated ? (
            <button onClick={logout} className="logout-button">Logga ut</button>
          ) : (
            <Link to="/login">Logga in</Link>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
