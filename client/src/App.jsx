import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ContractorOrdersView from './pages/ContractorOrdersView';
import CMRSignature from './pages/CMRSignature';
import VerificationPage from './pages/VerificationPage';
import Settings from './pages/Settings';
import AGB from './pages/AGB';
import AGBNew from './pages/AGBNew';
import Widerruf from './pages/Widerruf';
import WiderrufNew from './pages/WiderrufNew';
import EmployeeSettings from './pages/EmployeeSettings';
import ContractorOrdersWithAssignment from './pages/ContractorOrdersWithAssignment';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChatBot from './components/ChatBot';

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user.role === 'employee') {
    return <EmployeeDashboard />;
  }

  return user.role === 'customer' ? <CustomerDashboard /> : <ContractorDashboard />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/agb" element={<AGBNew />} />
          <Route path="/agb-old" element={<AGB />} />
          <Route path="/widerruf" element={<WiderrufNew />} />
          <Route path="/widerruf-old" element={<Widerruf />} />
          <Route path="/cmr/:cmrNumber" element={<CMRSignature />} />
          <Route path="/cmr/:cmrNumber/sender" element={<CMRSignature />} />
          <Route path="/cmr/:cmrNumber/carrier" element={<CMRSignature />} />
          <Route path="/cmr/:cmrNumber/consignee" element={<CMRSignature />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verification"
            element={
              <ProtectedRoute>
                <VerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee-settings"
            element={
              <ProtectedRoute>
                <EmployeeSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contractor/orders"
            element={
              <ProtectedRoute>
                <ContractorOrdersWithAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contractor/:contractorId/orders"
            element={
              <ProtectedRoute>
                <ContractorOrdersView />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* ChatBot - visible on all pages */}
        <ChatBot />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
