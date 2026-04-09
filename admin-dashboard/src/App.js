import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Records   from './pages/Records';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"          element={<Navigate to="/home" />} />
        <Route path="/home"      element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/records"   element={<Records />} />
      </Routes>
    </Router>
  );
}
