import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

interface ProtectedRouteProps {
  roleRequired?: string; 
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roleRequired, children }) => {
  const authContext = useContext(AuthContext);

  if (!authContext?.isAuthenticated) {
    // om användaren inte är inloggad, omdirigerar till login
    return <Navigate to="/" replace />;
  }

  if (roleRequired && authContext.role !== roleRequired) {
    // om rollen inte matchar, omdirigera till startsidan
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

