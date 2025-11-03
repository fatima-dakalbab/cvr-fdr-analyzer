import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthenticatedLayout from './components/layout/AuthenticatedLayout';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetails from './pages/CaseDetails';
import FDR from './pages/FDR';
import CVR from './pages/CVR';
import Correlate from './pages/Correlate';
import Reports from './pages/Report';
import HelpCenter from './pages/HelpCenter';
import AccountSettings from './pages/AccountSettings';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { AuthProvider, useAuth } from './hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setLoginForm({ username: '', password: '' });
    setCurrentView('login');
    setShowUserMenu(false);
    setCurrentPage('dashboard');
    setActiveCaseNumber(null);
    setIsCreateCaseOpen(false);
  };

  const openCaseDetails = (caseNumber) => {
    if (caseNumber) {
      setActiveCaseNumber(caseNumber);
    }
    setCurrentPage('case-details');
  };

  const openFDR = (caseNumber) => {
    setActiveCaseNumber(caseNumber || null);
    setCurrentPage('fdr');
  };

  const openCVR = (caseNumber) => {
    setActiveCaseNumber(caseNumber || null);
    setCurrentPage('cvr');
  };

  const openCorrelate = (caseNumber) => {
    setActiveCaseNumber(caseNumber || null);
    setCurrentPage('correlate');
  };

  const handleNavigateHome = () => {
    setCurrentPage('dashboard');
    setActiveCaseNumber(null);
    setShowNotifications(false);
    setShowUserMenu(false);
    setIsCreateCaseOpen(false);
  };

  const handleStartNewCase = () => {
    setCurrentPage('cases');
    setIsCreateCaseOpen(true);
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            onStartNewCase={handleStartNewCase}
            onOpenCases={() => setCurrentPage('cases')}
            onOpenCaseDetails={openCaseDetails}
            currentUser={currentUser}
          />
        );
      case 'cases':
        return (
          <Cases
            onStartNewCase={handleStartNewCase}
            onOpenFDR={openFDR}
            onOpenCVR={openCVR}
            onOpenCorrelate={openCorrelate}
            onOpenCaseDetails={openCaseDetails}
            isCreateCaseOpen={isCreateCaseOpen}
            onCloseCreateCase={() => setIsCreateCaseOpen(false)}
          />
        );
      case 'case-details':
        return (
          <CaseDetails
            caseNumber={activeCaseNumber}
            onBack={() => setCurrentPage('cases')}
            onOpenFDR={openFDR}
            onOpenCVR={openCVR}
            onOpenCorrelate={openCorrelate}
          />
        );
      case 'fdr':
        return <FDR caseNumber={activeCaseNumber} />;
      case 'cvr':
        return <CVR caseNumber={activeCaseNumber} />;
      case 'correlate':
        return <Correlate caseNumber={activeCaseNumber} />;
      case 'reports':
        return <Reports />;
      case 'help':
        return <HelpCenter onOpenGettingStarted={() => setCurrentPage('help')} />;
      default:
        return null;
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading your workspace…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route
      path="/"
      element={(
        <ProtectedRoute>
          <AuthenticatedLayout />
        </ProtectedRoute>
      )}
    >
      <Route index element={<Dashboard />} />
      <Route path="cases" element={<Cases />} />
      <Route path="cases/:caseNumber" element={<CaseDetails />} />
      <Route path="cases/:caseNumber/fdr" element={<FDR />} />
      <Route path="cases/:caseNumber/cvr" element={<CVR />} />
      <Route path="cases/:caseNumber/correlate" element={<Correlate />} />
      <Route path="reports" element={<Reports />} />
      <Route path="help" element={<HelpCenter />} />
      <Route path="account" element={<AccountSettings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
