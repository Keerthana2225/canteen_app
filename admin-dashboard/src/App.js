import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Records   from './pages/Records';
import Analytics from './pages/Analytics';
import Reports   from './pages/Reports';
import Critical  from './pages/Critical';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"          element={<Navigate to="/home" />} />
        <Route path="/home"      element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/records"   element={<Records />} />
        <Route path="/reports"   element={<Reports />} />
        <Route path="/critical"  element={<Critical />} />
      </Routes>
    </Router>
  );
}
