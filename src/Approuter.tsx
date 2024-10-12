import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hem from './screens/Home';
import About from './screens/About';
import Navigation from './navigate/Navigation';

function AppRouter() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Hem />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
