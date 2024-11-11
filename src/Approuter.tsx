import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hem from './screens/Home'; 
import About from './screens/About';
import Login from './screens/Login';
import Navigation from './navigate/Navigation';
import Register from './screens/Register';
import Admin from './screens/Admin';
import Store from './screens/Store'; 
import Pay from './screens/Pay';
import { AuthContext } from './context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function AppRouter() {
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false; 

  return (
    <Router>
      {isAuthenticated && <Navigation />}
      <Routes>
        {/* offentlig sida (login) */}
        <Route path="/" element={isAuthenticated ? <Hem /> : <Login />} /> 
        <Route path="/register" element={isAuthenticated ? <Hem /> : <Register />} />

        {/* skyddade sidor för inloggade användare */}
        <Route 
          path="/home" 
          element={<ProtectedRoute><Hem /></ProtectedRoute>} 
        />
        <Route 
          path="/store" 
          element={<ProtectedRoute><Store /></ProtectedRoute>} 
        />
        <Route 
          path="/about" 
          element={<ProtectedRoute><About /></ProtectedRoute>} 
        />
        <Route 
          path="/pay" 
          element={<ProtectedRoute><Pay /></ProtectedRoute>} 
        />

        {/* endast för admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roleRequired="admin">
              <Admin />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default AppRouter;
