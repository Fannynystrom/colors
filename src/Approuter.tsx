import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hem from './screens/Home'; 
import About from './screens/About';
import Login from './screens/Login';
import Navigation from './navigate/Navigation';
import Register from './screens/Register';
import Admin from './screens/Admin';
import Store from './screens/Store'; 
import { AuthContext } from './context/AuthContext';

function AppRouter() {
  const authContext = useContext(AuthContext);
  const isAuthenticated = authContext?.isAuthenticated || false; 

  return (
    <Router>
      {isAuthenticated && <Navigation />}
      <Routes>
        <Route path="/" element={<Login />} /> 
        <Route path="/home" element={<Hem />} /> 
        <Route path="/store" element={<Store />} /> 
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
