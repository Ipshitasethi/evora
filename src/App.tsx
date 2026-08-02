import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { CyclePage } from './pages/CyclePage';
import { AccountPage } from './pages/AccountPage';
import { ChatPage } from './pages/ChatPage';
import { InsightsPage } from './pages/InsightsPage';
import { LibraryPage } from './pages/LibraryPage';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { WellnessPage } from './pages/WellnessPage';
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import type { ReactNode } from 'react';

// Protected route wrapper
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Redirect logged-in users straight to dashboard
function PublicRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/cycle" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <PublicLayout />
          </PublicRoute>
        }
      >
        <Route index element={<LandingPage />} />
      </Route>

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignUpPage />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Onboarding (No sidebar) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated App Layout Pages */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/cycle" element={<CyclePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<ArticleDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/wellness" element={<WellnessPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
