import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { CasesList } from './pages/CasesList';
import { CaseDetail } from './pages/CaseDetail';
import { AuditLogPage } from './pages/AuditLogPage';
import { Login } from './pages/Login';
import { User } from './types';
import { api } from './services/api';

const AppLayout: React.FC<{ children: React.ReactNode; user: User | null; onLogout: () => void }> = ({
  children,
  user,
  onLogout
}) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar user={user} onLogout={onLogout} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('fintel_token');
    if (token) {
      try {
        const u = await api.getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error('Session expired or invalid token:', err);
        localStorage.removeItem('fintel_token');
        setUser(null);
      }
    } else {
      // Auto-fallback for demo ease
      try {
        const u = await api.getCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('fintel_token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route
            path="/login"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="/" element={<Dashboard />} />
          <Route path="/cases" element={<CasesList />} />
          <Route path="/cases/:caseId" element={<CaseDetail />} />
          <Route path="/audit" element={<AuditLogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
