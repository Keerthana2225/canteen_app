import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FeedbackTable from './pages/FeedbackTable';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/records"   element={<FeedbackTable />} />
      </Routes>
    </Router>
  );
}
