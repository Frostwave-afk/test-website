import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage     from './pages/LoginPage';
import HomePage      from './pages/HomePage';
import FormPage      from './pages/FormPage';
import StudentProfilePage from './pages/StudentProfilePage';
import AdminPage     from './pages/AdminPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HelpPage      from './pages/HelpPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Student routes */}
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/form" element={<ProtectedRoute><FormPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><StudentProfilePage /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin"     element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute adminOnly><AnalyticsPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
