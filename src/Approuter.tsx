import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hem from './screens/Home';
import About from './screens/About';
import Login from './screens/Login';
import Navigation from './navigate/Navigation';
import Register from './screens/Register'; // Importera Register-komponenten


function AppRouter() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Hem />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/register" element={<Register />} />

      </Routes>
    </Router>
  );
}

export default AppRouter;
