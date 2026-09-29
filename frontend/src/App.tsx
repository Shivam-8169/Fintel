import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { InvestigationPipeline } from './pages/InvestigationPipeline';
import { Dashboard } from './pages/Dashboard';
import { CasesList } from './pages/CasesList';
import { CaseDetail } from './pages/CaseDetail';
import { GraphPage } from './pages/GraphPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { DataManagement } from './pages/DataManagement';
import { DetectionPage } from './pages/DetectionPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportViewerPage } from './pages/ReportViewerPage';
import { AgentsPage } from './pages/AgentsPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';
import { DataDictionaryPage } from './pages/DataDictionaryPage';
import { Login } from './pages/Login';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { User } from './types';
import { api } from './services/api';
import { ThemeProvider } from './context/ThemeContext';

const AppLayout: React.FC<{ children: React.ReactNode; user: User | null; onLogout: () => void }> = ({
  children,
  user,
  onLogout
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname.startsWith('/accept-invite');

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-root min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-250 overflow-x-hidden relative">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close navigation drawer"
        />
      )}

      {/* Sidebar with Responsive Drawer Support */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="app-main-layout flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar
          user={user}
          onLogout={onLogout}
          onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          isSidebarOpen={mobileSidebarOpen}
        />
        <main className="app-content flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-7 bg-[var(--bg-app)] transition-colors duration-250">
          <div className="max-w-[1440px] mx-auto w-full">
            {children}
          </div>
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
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center text-xs text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-[var(--border-default)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout user={user} onLogout={handleLogout}>
          <Routes>
            <Route
              path="/login"
              element={<Login onLoginSuccess={handleLoginSuccess} />}
            />
            <Route
              path="/accept-invite"
              element={<AcceptInvitePage onLoginSuccess={handleLoginSuccess} />}
            />
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/overview" element={<Dashboard />} />
            <Route path="/new-investigation" element={<InvestigationPipeline />} />
            <Route path="/pipeline" element={<InvestigationPipeline />} />
            <Route path="/cases" element={<CasesList />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/detection" element={<DetectionPage />} />
            <Route path="/investigation" element={<InvestigationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/:reportId" element={<ReportViewerPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/ingestion" element={<DataManagement />} />
            <Route path="/data-dictionary" element={<DataDictionaryPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
