import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './src/context/AuthContext';

interface ProtectedRouteProps {
  roleRequired: string;
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ roleRequired, children }) => {
  const authContext = useContext(AuthContext);

  if (!authContext?.isAuthenticated || authContext.role !== roleRequired) {
    // skickas till login om ngt inte stämmer
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;