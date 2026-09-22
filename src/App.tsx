import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import { SeoAuditorView } from './pages/SeoAuditorView';
import OSShell from './components/OSShell';
import OS2Shell from './components/OS2Shell';
import { companyData } from './data/structure';
import { useState } from 'react';

/* ── Protected Route wrapper ── */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/* ── App shell (OS1 + OS2 toggle) with logout ── */
const AppShell: React.FC = () => {
  const [mode, setMode] = useState<'os1' | 'os2'>('os1');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (mode === 'os2') {
    return <OS2Shell onExitOS2={() => setMode('os1')} onLogout={handleLogout} />;
  }

  return (
    <OSShell
      companyData={companyData}
      onEnterOS2={() => setMode('os2')}
      onLogout={handleLogout}
    />
  );
};

/* ── Main App with routes ── */
function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/seo" element={<SeoAuditorView />} />

      {/* Protected */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
