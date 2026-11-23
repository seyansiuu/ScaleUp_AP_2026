import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StartupProvider } from './context/StartupContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DecisionsPage from './pages/DecisionsPage';
import EmployeesPage from './pages/EmployeesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-mono">
        ScaleUp Simulation Engine • PostgreSQL & Express REST Architecture • AP 2026
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StartupProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/decisions" element={<DecisionsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </StartupProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
